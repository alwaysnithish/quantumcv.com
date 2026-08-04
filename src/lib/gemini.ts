/**
 * src/lib/gemini.ts
 * Direct port of ai_engine/gemini.py — same prompts, same model fallback
 * chain, same JSON-extraction logic. Uses @google/generative-ai instead of
 * the Python google-generativeai SDK.
 */
import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];

function getModel(modelName?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured.');

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName ?? MODELS[0] });
}

// ── profile / country detection (identical logic to Python) ──

interface Profile {
  stage: 'fresher' | 'junior' | 'mid' | 'senior';
  isFresher: boolean;
  hasExperience: boolean;
  hasInternship: boolean;
  hasProjects: boolean;
  yearsExp: number;
}

function detectProfile(rawData: string): Profile {
  const raw = rawData.toLowerCase();

  const isFresher = [
    'fresher', 'final year', 'b.tech', 'btech', 'b.e.', 'be student',
    'pursuing', 'currently studying', 'expected graduation',
    '1st year', '2nd year', '3rd year', '4th year',
  ].some((w) => raw.includes(w));

  const hasExperience = [
    'years of experience', 'yrs experience', 'worked at', 'employed',
    'full time', 'permanent', 'senior', 'lead', 'manager', 'architect',
  ].some((w) => raw.includes(w));

  const hasInternship = ['intern', 'internship', 'trainee', 'apprentice'].some((w) =>
    raw.includes(w)
  );

  const hasProjects = ['project', 'built', 'developed', 'created', 'github', 'deployed'].some(
    (w) => raw.includes(w)
  );

  let yearsExp = 0;
  const match = raw.match(/(\d+)\s*\+?\s*years?\s+(?:of\s+)?experience/);
  if (match) yearsExp = parseInt(match[1], 10);

  let stage: Profile['stage'];
  if (isFresher || (!hasExperience && yearsExp === 0)) stage = 'fresher';
  else if (yearsExp <= 3) stage = 'junior';
  else if (yearsExp <= 7) stage = 'mid';
  else stage = 'senior';

  return { stage, isFresher, hasExperience, hasInternship, hasProjects, yearsExp };
}

interface CountryRules {
  includePhoto: boolean;
  includeDob: boolean;
  dateFormat: string;
  emphasizeCgpa: boolean;
  includeLanguages: boolean;
  objectiveType: string;
  atsNote: string;
  fontStyle: string;
}

const COUNTRY_RULES: Record<string, CountryRules> = {
  India: {
    includePhoto: false, includeDob: false, dateFormat: 'Mon YYYY', emphasizeCgpa: true,
    includeLanguages: true, objectiveType: 'objective',
    atsNote: 'Optimized for Naukri.com and LinkedIn India ATS systems.', fontStyle: 'professional_clean',
  },
  'United States': {
    includePhoto: false, includeDob: false, dateFormat: 'Mon YYYY', emphasizeCgpa: false,
    includeLanguages: false, objectiveType: 'summary',
    atsNote: 'Optimized for Workday, Greenhouse, and Lever ATS systems.', fontStyle: 'modern_minimal',
  },
  'United Kingdom': {
    includePhoto: false, includeDob: false, dateFormat: 'Mon YYYY', emphasizeCgpa: true,
    includeLanguages: false, objectiveType: 'personal_statement',
    atsNote: 'Optimized for Reed, TotalJobs, and LinkedIn UK ATS.', fontStyle: 'professional_clean',
  },
  UAE: {
    includePhoto: true, includeDob: true, dateFormat: 'Mon YYYY', emphasizeCgpa: true,
    includeLanguages: true, objectiveType: 'objective',
    atsNote: 'Optimized for Bayt.com and GulfTalent ATS.', fontStyle: 'formal_classic',
  },
  Canada: {
    includePhoto: false, includeDob: false, dateFormat: 'Mon YYYY', emphasizeCgpa: false,
    includeLanguages: true, objectiveType: 'summary',
    atsNote: 'Optimized for Workday and Indeed Canada ATS.', fontStyle: 'modern_minimal',
  },
  Germany: {
    includePhoto: true, includeDob: true, dateFormat: 'Mon YYYY', emphasizeCgpa: true,
    includeLanguages: true, objectiveType: 'profile',
    atsNote: 'German Lebenslauf format. Optimized for XING and StepStone.', fontStyle: 'formal_classic',
  },
  Australia: {
    includePhoto: false, includeDob: false, dateFormat: 'Mon YYYY', emphasizeCgpa: false,
    includeLanguages: false, objectiveType: 'summary',
    atsNote: 'Optimized for SEEK and LinkedIn Australia ATS.', fontStyle: 'modern_minimal',
  },
  Singapore: {
    includePhoto: true, includeDob: true, dateFormat: 'Mon YYYY', emphasizeCgpa: true,
    includeLanguages: true, objectiveType: 'summary',
    atsNote: 'Optimized for JobsDB and LinkedIn Singapore ATS.', fontStyle: 'professional_clean',
  },
};

const DEFAULT_RULES: CountryRules = {
  includePhoto: false, includeDob: false, dateFormat: 'Mon YYYY', emphasizeCgpa: true,
  includeLanguages: true, objectiveType: 'objective',
  atsNote: 'ATS-optimized for global job boards.', fontStyle: 'professional_clean',
};

function getCountryRules(country: string): CountryRules {
  return COUNTRY_RULES[country] ?? DEFAULT_RULES;
}

function buildResumePrompt(
  rawData: string,
  jobDescription: string,
  country: string,
  role: string
): string {
  const profile = detectProfile(rawData);
  const rules = getCountryRules(country);
  const { stage } = profile;

  return `You are QuantumCV, an expert resume architect. Generate a highly tailored resume in JSON format.

CRITICAL RULES:
- Return ONLY valid JSON. No markdown, no backticks, no explanation.
- Include all required fields. Do NOT omit any field.
- Sort sections by "order" field in ascending order.
- Generate unique snake_case IDs for all sections and entries.

═══ INPUT ═══
Career Data:
${rawData}

Job Description:
${jobDescription || 'Not provided — generate a strong general-purpose resume.'}

═══ CONTEXT (for tone/emphasis only — NOT a template to follow) ═══
Country: ${country}
Target Role: ${role}
Detected career stage (rough signal only): ${stage} (${profile.yearsExp} years detected)
Has Projects: ${profile.hasProjects}
Has Internship: ${profile.hasInternship}

═══ RULES FOR ${country.toUpperCase()} ═══
- Include photo: ${rules.includePhoto}
- Include DOB: ${rules.includeDob}
- Include languages: ${rules.includeLanguages}
- Emphasize CGPA: ${rules.emphasizeCgpa}
- Intro type: ${rules.objectiveType}
- ${rules.atsNote}

═══ SECTIONS — CORE BASELINE + FULLY DYNAMIC BEYOND THAT (CRITICAL) ═══
There is NO fixed template for the overall resume shape or ordering — but a small set of sections are near-universal on any real resume, and you MUST include each of these if the input has data to support it (do not omit them just because you're avoiding a "template"):
   - An intro section (Summary or Objective, per the country's intro type above), if there's enough career context to write one
   - Experience — if the input mentions ANY professional experience, internships, or work history
   - Education — if the input mentions any schooling/degree at all
   - Skills (in whichever of the skills types fits best — grouped, bars, dots, or tags) — if the input lists any skills/technologies
These four are the baseline. Beyond them, everything is fully dynamic — determined entirely by what this specific person's input actually contains, not by convention or career stage:

1. WHICH additional sections exist — a long, varied career may legitimately need many extra sections (e.g. Leadership, Publications, Patents, Board Positions, Speaking Engagements, Volunteer Work, Awards — whatever the person actually has). A short career may need none beyond the baseline. Do not add an extra section just because it's "typical" — only include it if the input actually supports it with real content.

2. IN WHAT ORDER — put whatever is most relevant to the target role and strongest for this specific person first, including where the baseline sections themselves are placed. General principles (not rules):
   - If someone has substantial, relevant work experience, that (or a Summary leading into it) typically comes early.
   - If someone has little/no work experience but strong education/projects, those typically lead instead.
   - Certifications and secondary sections (achievements, languages, volunteer work, hobbies, references) are placed wherever they make sense for this person's actual balance of content — there's no universal position for them.
   - If the input describes a long or complex career with many distinct categories of accomplishment, don't compress them into one section — split them into as many clearly-titled sections as the content actually warrants.

3. Beyond the baseline, scan the ENTIRE input for every one of these categories and include a section for any that are genuinely present (do not skip any of these merely because they're less common) — but do NOT invent placeholder content for a category that isn't actually in the input:
   - Hobbies / Interests
   - Soft Skills (communication, leadership, teamwork, etc. — separate from technical skills)
   - Volunteer Experience
   - Achievements / Awards (at ANY career stage, not just early-career)
   - Publications
   - References (only fabricate "Available upon request." if the input explicitly says that; otherwise list what's actually given)
   - Languages (see LANGUAGES SECTION rules below)
   - Anything else clearly present that doesn't fit a standard category — give it its own accurately-titled section rather than omitting it or awkwardly merging it into another section

═══ SECTION "type" FIELD — HOW TO CHOOSE ═══
Use one of these when the content matches: "summary" / "objective" (intro paragraph), "skills" (grouped list), "skills-bars" (percentage bars), "skills-dots" (5-dot rating), "skills-tags" (pill tags), "languages", "bullet-list" (a flat list of points with no titles/dates — good for e.g. a flat achievements or soft-skills list), "table", "custom-text" (a plain paragraph, e.g. hobbies or references).
For anything else — Experience, Education, Projects, Certifications, Volunteer Work, Publications, Awards, Leadership, or any other category with distinct items that each have a title/date/description — use a descriptive type name (e.g. "experience", "volunteer", "publications", "leadership") and provide an "entries" array (each with title/subtitle/location/date_start/date_end/bullets as relevant). This entries-based shape renders correctly for any category, so feel free to name the type after what it actually is.

═══ OUTPUT JSON SCHEMA ═══
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+91 98765 43210",
  "linkedin": "linkedin.com/in/username",
  "github": "github.com/username",
  "location": "City, Country",
  "target_role": "${role}",
  "country": "${country}",
  "career_stage": "${stage}",
  "ai_confidence": 85,
  "ats_score": 82,

  "layout_config": {
    "intro_section_type": "${rules.objectiveType}",
    "show_photo_placeholder": ${rules.includePhoto},
    "show_dob": ${rules.includeDob},
    "show_languages": ${rules.includeLanguages},
    "font_style": "${rules.fontStyle}",
    "accent_color": "#2563EB",
    "section_order": ["<list the ACTUAL section titles you included, in the exact order you placed them>"],
    "emphasize_cgpa": ${rules.emphasizeCgpa},
    "ats_platform": "${rules.atsNote.slice(0, 50)}"
  },

  "sections": [
    {
      "id": "s-unique-id",
      "type": "summary|objective|experience|education|projects|skills|skills-bars|skills-dots|skills-tags|certifications|languages",
      "title": "SECTION TITLE",
      "order": 1,
      "entries": [
        {
          "id": "e-unique-id",
          "title": "Position/Degree Title",
          "subtitle": "Company/University/Tech Stack",
          "location": "City, Country",
          "date_start": "Mon YYYY",
          "date_end": "Mon YYYY or Present",
          "bullets": ["Action verb + impact", "Another bullet"]
        }
      ],
      "skill_groups": [
        { "category": "Languages", "skills": ["Python", "JavaScript"] }
      ],
      "skills": [
        { "name": "Python", "level": 90 }
      ],
      "tags": ["Python", "Django"],
      "summary_text": "Professional summary paragraph"
    }
  ]
}

═══ LANGUAGES SECTION — IMPORTANT ═══
If the input mentions ANY languages spoken (e.g. "English, Hindi, Telugu" or "fluent in X"), you MUST create a "languages" type section. Each entry uses ONLY "title" (language name) and "subtitle" (proficiency level e.g. "Native", "Fluent", "Professional", "Conversational") — do NOT use bullets for languages. Example:
{"id":"s-lang","type":"languages","title":"LANGUAGES","order":8,"entries":[{"id":"e-lang-1","title":"English","subtitle":"Fluent"},{"id":"e-lang-2","title":"Hindi","subtitle":"Native"}]}

═══ BULLET RULES ═══
- Start with strong past-tense action verbs
- Include quantified metrics: %, numbers, time, users, revenue
- Use STAR format: Situation → Task → Action → Result
- Align keywords with the job description for ATS
- 2-4 bullets per entry maximum
- PLAIN TEXT ONLY — never use markdown formatting (no **bold**, no *italic*, no # headers, no backticks). Every field in the output (bullets, summary_text, titles, subtitles) must be plain prose with no markdown syntax characters at all.

═══ COMPLETENESS RULES (CRITICAL) ═══
- NEVER create a section with an empty title and no content. If you add a "Certifications", "Languages", or any other section to the "sections" array, it MUST contain actual entries/data extracted or reasonably inferred from the input — a section with a heading but zero entries is a bug, not acceptable output.
- If the input career data mentions certifications, licenses, languages spoken, publications, or awards anywhere (even briefly), you MUST create a populated section for them with real content — do not silently omit or leave them blank.
- If the input does not mention a category at all (e.g. no languages are mentioned anywhere), simply do not include that section — do not invent an empty placeholder for it either.`;
}

function stripJsonFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
}

/**
 * Removes sections the AI generated with a heading but no actual content —
 * an empty "LANGUAGES" or "CERTIFICATIONS" header with nothing under it is
 * worse than not showing the section at all.
 */
/**
 * Strips markdown formatting characters the model sometimes emits despite
 * being told not to (e.g. "**PostgreSQL**" instead of plain "PostgreSQL").
 * Applied as a safety net on top of the prompt instruction, not instead of it.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // **bold**
    .replace(/\*(.*?)\*/g, '$1') // *italic*
    .replace(/__(.*?)__/g, '$1') // __bold__
    .replace(/`(.*?)`/g, '$1') // `code`
    .replace(/^#{1,6}\s+/gm, ''); // # headers
}

function sanitizeTextFields(data: any): any {
  if (Array.isArray(data.sections)) {
    for (const sec of data.sections) {
      if (typeof sec.summary_text === 'string') sec.summary_text = stripMarkdown(sec.summary_text);
      if (Array.isArray(sec.entries)) {
        for (const en of sec.entries) {
          if (typeof en.title === 'string') en.title = stripMarkdown(en.title);
          if (typeof en.subtitle === 'string') en.subtitle = stripMarkdown(en.subtitle);
          if (Array.isArray(en.bullets)) en.bullets = en.bullets.map((b: string) => (typeof b === 'string' ? stripMarkdown(b) : b));
        }
      }
      if (Array.isArray(sec.bullets)) sec.bullets = sec.bullets.map((b: string) => (typeof b === 'string' ? stripMarkdown(b) : b));
    }
  }
  return data;
}

function isSectionEmpty(sec: any): boolean {
  switch (sec.type) {
    case 'summary':
    case 'objective':
    case 'profile':
    case 'personal_statement':
    case 'custom-text':
      return !sec.summary_text || !sec.summary_text.trim();
    case 'skills':
      return !sec.skill_groups?.length || sec.skill_groups.every((g: any) => !g.skills?.length);
    case 'skills-bars':
    case 'skills-dots':
      return !sec.skills?.length;
    case 'skills-tags':
      return !sec.tags?.length;
    case 'languages':
      return !sec.entries?.length;
    case 'bullet-list':
      return !sec.bullets?.length;
    case 'table':
      return !sec.tableData?.rows?.length;
    case 'divider':
      return false; // dividers are intentionally content-free
    default:
      return !sec.entries?.length || sec.entries.every((e: any) => !e.title && !e.bullets?.length);
  }
}

function dropEmptySections(data: any): any {
  if (Array.isArray(data.sections)) {
    data.sections = data.sections.filter((sec: any) => !isSectionEmpty(sec));
  }
  return data;
}

function extractJson(text: string): any {
  const cleaned = stripJsonFences(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('AI returned malformed JSON. Please try again.');
  }
}

export async function generateResume(
  rawData: string,
  jobDescription: string,
  country: string,
  role: string
): Promise<any> {
  if (!rawData.trim()) throw new Error('Career data is required.');

  const prompt = buildResumePrompt(rawData, jobDescription, country, role);
  const model = getModel();
  const generationConfig: GenerationConfig = {
    temperature: 0.3,
    topP: 0.9,
    // A resume with many legitimate sections (long/varied career) needs
    // real headroom — this used to be 8192, which could truncate rich
    // multi-section output mid-JSON for exactly the kind of long-career
    // profiles that should get MORE sections, not fewer.
    maxOutputTokens: 16384,
  };

  let rawText: string;
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });
    rawText = result.response.text().trim();
  } catch (err: any) {
    throw new Error(`Resume generation failed: ${err.message ?? err}`);
  }

  const data = sanitizeTextFields(dropEmptySections(extractJson(rawText)));
  if (Array.isArray(data.sections)) {
    data.sections.sort((a: any, b: any) => (a.order ?? 99) - (b.order ?? 99));
  }
  return data;
}

export async function enhanceBullet(bullet: string, context = ''): Promise<string> {
  if (!bullet.trim()) return bullet;

  const model = getModel();
  const prompt = `Rewrite this resume bullet to be more impactful, quantified, and ATS-optimized.

Context: ${context}
Original: ${bullet}

Return ONLY the improved bullet. No explanation. Start with a strong action verb. Add metrics if missing.`;

  try {
    const result = await model.generateContent(prompt);
    return stripMarkdown(result.response.text().trim());
  } catch (err) {
    console.error('Bullet enhance error:', err);
    return bullet;
  }
}

async function chatEditResumeOnce(
  resumeData: any,
  instruction: string
): Promise<{ data: any; reply: string }> {
  if (!instruction.trim()) throw new Error('Instruction is required.');

  const model = getModel();

  const prompt = `You are QuantumCV's expert resume editor. Apply this user instruction to the resume.

CURRENT RESUME (JSON) — this is the COMPLETE current resume. Every section shown here must appear in your output (unless the instruction explicitly asks to remove something) — do not drop any section, even ones unrelated to the instruction:
${JSON.stringify(resumeData, null, 2)}

USER INSTRUCTION: ${instruction}

═══ YOU CAN PERFORM THESE EDITS ═══

1. ADD SECTIONS - Create new sections of any type:
   - "Add a Skills section with bars" → Create skills-bars section
   - "Add a table for projects" → Create table section
   - "Add certifications" → Create certifications section
   Example: {"type": "skills-bars", "title": "SKILLS", "order": 5, "skills": [{"name": "Python", "level": 90}]}

2. EDIT TABLES - Modify table structure and data:
   - "Change the 3rd row to X" → Update table row
   - "Add a column for dates" → Extend tableData.colWidths and rows
   - "Make first column 40%" → Adjust colWidths
   Example: {"tableData": {"hasHeader": true, "colWidths": [40, 30, 30], "rows": [["Col1", "Col2", "Col3"]]}}

3. SKILL BARS - Modify percentages and skills:
   - "Change Python to 85%" → Update skill.level
   - "Add Java at 70%" → Append to skills array
   - "Remove React" → Filter skills array

4. SKILL DOTS (5-dot rating):
   - "Change Design to 4 dots" → Set skill.level = 4
   - "Add Communication at 5 stars" → Append skill

5. SKILL TAGS (pill chips):
   - "Add 'Machine Learning' tag" → Append to tags array
   - "Remove 'Docker' tag" → Filter tags array

6. EDIT ENTRIES (experience, education, projects):
   - "Change the title to Senior Dev" → Update entry.title
   - "Add bullet: Led team of 5" → Append to bullets
   - "Remove last bullet" → Filter bullets
   - "Change date to Jan 2024" → Update entry.date_start/date_end

7. EDIT BULLETS - Improve or change:
   - "Make first bullet more impactful" → Enhance bullet[0]
   - "Add metrics to bullets" → Enhance with numbers
   - "Rewrite bullets for SDE role" → Rewrite for context

8. REORDER SECTIONS:
   - "Move Skills to position 3" → Update section.order
   - "Put Education last" → Set order to 99

9. RENAME SECTIONS:
   - "Rename to 'Tech Stack'" → Update section.title

10. ADD ENTRIES:
    - "Add experience at Google" → Append to section.entries
    - "Add AWS certification" → Create new entry in certifications

11. DELETE CONTENT:
    - "Remove Skills section" → Delete section
    - "Remove last bullet" → Filter bullets
    - "Delete that project" → Remove entry

12. CONVERT BETWEEN FORMATS (CRITICAL — this must actually work, not just partially apply):
    When asked to change a section's visual format (e.g. "change this to dots", "convert skills to tags", "make this a bar chart instead"), you MUST change the section's "type" field AND reshape its data into that type's correct shape — do not just relabel it while leaving the old data structure in place.
    - skills-bars → skills-dots: convert each skill's level from a 0-100 percentage to a 1-5 rating: round(level / 20), minimum 1, maximum 5.
    - skills-dots → skills-bars: convert each skill's level from 1-5 to a 0-100 percentage: level * 20.
    - skills-bars / skills-dots → skills-tags: take each skill's "name" only, discard the level/rating, into a "tags" array of strings.
    - skills-tags → skills-bars or skills-dots: take each tag string as a skill "name"; since tags carry no proficiency info, assign a reasonable default level (75 for bars, 4 for dots) unless the user specifies levels.
    - skills (grouped, with skill_groups) → skills-bars / skills-dots / skills-tags: flatten every skill across all skill_groups into one flat list; assign reasonable default levels the same way as above (grouped skills also carry no per-skill proficiency).
    - skills-bars / skills-dots / skills-tags → skills (grouped): group the flat skill list into sensible categories (e.g. "Languages", "Frameworks", "Tools") based on what the skills actually are, or a single "Skills" category if grouping isn't obvious.
    This same reshape-the-data principle applies to ANY format conversion the user asks for, not just skills — always produce data in the correct shape for the new type, never a hybrid of old and new.

═══ RULES FOR JSON OUTPUT ═══
- Return the COMPLETE resume JSON — every existing section and entry must be present in your output, plus whatever you added/changed. Returning only the new/changed section, or omitting sections you didn't touch, is a critical error.
- PRESERVE all existing "id" values exactly
- Generate unique IDs for NEW sections: s-{type}-{suffix}
- Generate unique IDs for NEW entries: e-{suffix}
- Maintain proper nesting and field types
- Keep sections sorted by order
- Validate all JSON before returning
- Return ONLY valid JSON, no markdown
- After JSON, write on NEW LINE: REPLY: <description of what changed>

Output format:
{resume_json_here}
REPLY: Brief description of what changed`;

  let raw: string;
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      // Must be generous — this call echoes back the ENTIRE resume (not just
      // a diff), so a large/well-developed resume with many sections needs
      // real headroom here, not just enough for the changed part.
      generationConfig: { temperature: 0.2, maxOutputTokens: 16384 },
    });
    raw = result.response.text().trim();
  } catch (err: any) {
    throw new Error(`Resume edit failed: ${err.message ?? err}`);
  }

  let reply = 'Resume updated.';
  if (raw.includes('REPLY:')) {
    const idx = raw.lastIndexOf('REPLY:');
    reply = raw.slice(idx + 'REPLY:'.length).trim();
    raw = raw.slice(0, idx).trim();
  }

  const data = sanitizeTextFields(dropEmptySections(extractJson(raw)));
  if (!Array.isArray(data.sections) || data.sections.length === 0) {
    throw new Error('AI response was incomplete (missing sections). Please try again or rephrase the request.');
  }

  const beforeCount = Array.isArray(resumeData?.sections) ? resumeData.sections.length : 0;
  if (beforeCount > 0 && data.sections.length < beforeCount) {
    console.warn(
      `[chatEditResume] Section count dropped from ${beforeCount} to ${data.sections.length} — ` +
        `this is expected if the instruction asked to remove something, but worth checking if not. ` +
        `Instruction was: "${instruction}"`
    );
  }

  data.sections.sort((a: any, b: any) => (a.order ?? 99) - (b.order ?? 99));

  return { data, reply };
}

/**
 * Public entry point — wraps chatEditResumeOnce with a single automatic
 * retry. Chat edits fail more often than generation because the prompt is
 * larger (full resume + instruction) and the model has to both understand
 * an open-ended instruction AND return well-formed JSON; a transient
 * malformed response or dropped-section response is usually not
 * reproducible on a second attempt with the same input.
 */
export async function chatEditResume(
  resumeData: any,
  instruction: string
): Promise<{ data: any; reply: string }> {
  try {
    return await chatEditResumeOnce(resumeData, instruction);
  } catch (err) {
    console.warn('Chat edit failed once, retrying:', err);
    return await chatEditResumeOnce(resumeData, instruction);
  }
}

export async function analyzeResumeForImprovements(resumeData: any): Promise<any> {
  const model = getModel();

  const prompt = `Analyze this resume and provide specific, actionable improvement suggestions.

RESUME:
${JSON.stringify(resumeData, null, 2).slice(0, 5000)}

For each section, suggest:
1. What's working well
2. What could be improved
3. Specific examples of better phrasing
4. ATS optimization tips

Return ONLY a JSON object with this structure:
{
  "overall_score": 75,
  "ats_readiness": 80,
  "suggestions": {
    "bullets": ["Suggestion 1", "Suggestion 2"],
    "structure": ["Structure suggestion"],
    "keywords": ["Missing keyword suggestion"],
    "format": ["Format improvement"]
  },
  "quick_wins": ["Quick improvement 1"]
}`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
    });
    return extractJson(result.response.text().trim());
  } catch (err) {
    console.error('Analysis error:', err);
    return { error: 'Could not analyze resume' };
  }
}

export async function generateCoverLetter(
  resumeData: any,
  jobDescription: string
): Promise<string> {
  if (!jobDescription.trim()) throw new Error('Job description is required.');

  const model = getModel();
  const prompt = `Write a compelling cover letter based on this resume and job description.

RESUME:
Name: ${resumeData.name ?? 'Candidate'}
Role: ${resumeData.target_role ?? ''}
Experience: ${resumeData.career_stage ?? ''}

RESUME DATA:
${JSON.stringify(resumeData, null, 2).slice(0, 4000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

Write a 3-4 paragraph cover letter that:
1. Opens with enthusiasm for the role
2. Highlights relevant experience with metrics
3. Shows alignment with company values
4. Closes with call to action

Professional tone, no placeholder brackets.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
    });
    return result.response.text().trim();
  } catch (err: any) {
    throw new Error(`Failed to generate cover letter: ${err.message ?? err}`);
  }
}
