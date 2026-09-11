/**
 * src/lib/gemini.ts
 * Direct port of ai_engine/gemini.py — same prompts, same model fallback
 * chain, same JSON-extraction logic. Uses @google/generative-ai instead of
 * the Python google-generativeai SDK.
 */
import { GoogleGenerativeAI, GenerationConfig, Part } from '@google/generative-ai';
import { reviewResume, parseResumeStructure, detectResumeMetrics, getResumeText, runConsistencyCheck } from './resume-review';
import { buildEvidenceMap, validateAndGroundAnalysis } from './evidence-grounding';
import { extractTextFromDocument } from './pdf-parser';

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];

function getModel(modelName?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured.');

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName ?? MODELS[0] });
}

/**
 * Calls generateContent, retrying across the MODELS fallback chain
 * (gemini-2.5-flash → gemini-2.5-flash-lite → gemini-2.0-flash) whenever a
 * model errors out (rate limit, transient outage, etc.), instead of only
 * ever calling MODELS[0]. Returns the first successful result; throws the
 * last error only if every model in the chain fails.
 */
async function generateWithFallback(
  contents: { role: string; parts: Part[] }[],
  generationConfig: GenerationConfig
) {
  let lastErr: unknown;
  for (const modelName of MODELS) {
    try {
      const model = getModel(modelName);
      return await model.generateContent({ contents, generationConfig });
    } catch (err) {
      lastErr = err;
      console.warn(`Model ${modelName} failed, trying next fallback:`, err);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('All fallback models failed.');
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
    atsNote: 'Uses ATS-friendly formatting and resume conventions commonly used in the India job market.', fontStyle: 'professional_clean',
  },
  'United States': {
    includePhoto: false, includeDob: false, dateFormat: 'Mon YYYY', emphasizeCgpa: false,
    includeLanguages: false, objectiveType: 'summary',
    atsNote: 'Uses ATS-friendly formatting and resume conventions commonly used in the US job market.', fontStyle: 'modern_minimal',
  },
  'United Kingdom': {
    includePhoto: false, includeDob: false, dateFormat: 'Mon YYYY', emphasizeCgpa: true,
    includeLanguages: false, objectiveType: 'personal_statement',
    atsNote: 'Uses ATS-friendly formatting and resume conventions commonly used in the UK job market.', fontStyle: 'professional_clean',
  },
  UAE: {
    includePhoto: true, includeDob: true, dateFormat: 'Mon YYYY', emphasizeCgpa: true,
    includeLanguages: true, objectiveType: 'objective',
    atsNote: 'Uses ATS-friendly formatting and resume conventions commonly used in the UAE job market.', fontStyle: 'formal_classic',
  },
  Canada: {
    includePhoto: false, includeDob: false, dateFormat: 'Mon YYYY', emphasizeCgpa: false,
    includeLanguages: true, objectiveType: 'summary',
    atsNote: 'Uses ATS-friendly formatting and resume conventions commonly used in the Canada job market.', fontStyle: 'modern_minimal',
  },
  Germany: {
    includePhoto: true, includeDob: true, dateFormat: 'Mon YYYY', emphasizeCgpa: true,
    includeLanguages: true, objectiveType: 'profile',
    atsNote: 'Uses ATS-friendly formatting and resume conventions commonly used in the German job market (German Lebenslauf conventions where applicable).', fontStyle: 'formal_classic',
  },
  Australia: {
    includePhoto: false, includeDob: false, dateFormat: 'Mon YYYY', emphasizeCgpa: false,
    includeLanguages: false, objectiveType: 'summary',
    atsNote: 'Uses ATS-friendly formatting and resume conventions commonly used in the Australia job market.', fontStyle: 'modern_minimal',
  },
  Singapore: {
    includePhoto: true, includeDob: true, dateFormat: 'Mon YYYY', emphasizeCgpa: true,
    includeLanguages: true, objectiveType: 'summary',
    atsNote: 'Uses ATS-friendly formatting and resume conventions commonly used in the Singapore job market.', fontStyle: 'professional_clean',
  },
};

const DEFAULT_RULES: CountryRules = {
  includePhoto: false, includeDob: false, dateFormat: 'Mon YYYY', emphasizeCgpa: true,
  includeLanguages: true, objectiveType: 'objective',
  atsNote: 'Uses ATS-friendly formatting and resume conventions commonly used in international job markets.', fontStyle: 'professional_clean',
};

function getCountryRules(country: string): CountryRules {
  return COUNTRY_RULES[country] ?? DEFAULT_RULES;
}

function buildResumePrompt(
  rawData: string,
  jobDescription: string,
  country: string,
  role: string,
  templateId = 'classic-clean'
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
Selected template: ${templateId}
Detected career stage (rough signal only): ${stage} (${profile.yearsExp} years detected)
Has Projects: ${profile.hasProjects}
Has Internship: ${profile.hasInternship}

═══ CAREER-STAGE SECTION POLICY (MANDATORY) ═══
Use the detected stage to choose emphasis, but include a section only when the
candidate's input contains evidence for it. Never create empty headings,
placeholder entries, generic sample bullets, or "typical" sections.
- fresher: this stage has NO single fixed section list — the required set
  depends on which of the sub-statuses below the candidate's input actually
  matches. Detect the sub-status from evidence, then include ONLY the
  sections that sub-status needs. Never include a section "because freshers
  usually have one" — every section must trace back to real input content.

  "PROJECTS" IS FIELD-AGNOSTIC — do not assume a tech candidate. Treat any of
  the following as an equivalent of "Projects" for whichever field the input
  shows: coding/build projects (tech), case studies or capstone projects
  (business/commerce/design), clinical rotations or lab work (healthcare/
  science), campaign or portfolio pieces (marketing/design/media), moot
  court or drafted briefs (law), field research or thesis work (academia).
  Title the section to match what it actually is (e.g. "Case Studies",
  "Clinical Experience", "Campaigns", "Portfolio Work") rather than forcing
  a literal "Projects" label onto non-technical evidence.

  FRESHER SUB-STATUS → REQUIRED SECTIONS (choose based on evidence found):
  • Student with projects/case-studies/portfolio work, no internship:
    REQUIRED = Education, the field-appropriate Projects-equivalent
    section, Skills. OPTIONAL if evidenced = Certifications, Achievements,
    coursework highlights, leadership/volunteer work. Do NOT add Experience,
    Internship, or Summary/Objective unless input clearly supports one.
  • Student with an internship, articleship, clerkship, or clinical
    placement (paid or unpaid): REQUIRED = Education, Internship (its own
    section, not merged into "Experience" unless the candidate calls it
    that), Skills. Projects-equivalent and Certifications become REQUIRED
    only if evidenced; otherwise omit.
  • Student with neither projects nor internship (education + skills only):
    REQUIRED = Education, Skills. Do not stretch coursework, one-line club
    mentions, or hobbies into full sections with invented bullets — keep
    each to what the input actually states. A short evidence-based Summary
    is allowed only if the input gives enough for one truthful sentence;
    otherwise omit the intro entirely rather than writing a generic filler
    line.
  • Student with strong achievements/competitions/certifications but thin
    project history: REQUIRED = Education, Skills, and the specific
    Achievements/Certifications section(s) the evidence supports — these
    substitute for the Projects-equivalent rather than sitting alongside
    empty ones.

  In every fresher case: Experience is FORBIDDEN unless real paid/unpaid
  work or an internship is explicitly present in the input. CGPA/percentage
  is included only if the candidate supplied a number. Never pad a thin
  fresher profile with a generic Objective, invented soft-skills list, or
  a "Hobbies" section unless the input actually names them.
- junior: prioritize relevant Experience/Internships, Projects, Skills,
  Education, and certifications/achievements that are actually supplied.
- mid: prioritize relevant Experience and measurable scope, then Projects,
  Skills, Education, and only supplied leadership/awards/publications.
- senior: prioritize leadership, architecture, business outcomes, scope,
  mentoring, publications, patents, or board/advisory work only when explicitly
  evidenced. Do not add fresher-style coursework or a long objective.
If the input is ambiguous, choose the conservative stage and preserve the
candidate's wording rather than guessing. The final sections array must be the
smallest complete set needed to represent the supplied evidence.

═══ LENGTH / PAGE BUDGET (CRITICAL) ═══
Total output must fit the space a real recruiter will actually read for this
stage — do not fill space just because a section exists:
- fresher / junior: target a single page. Total bullets across the whole
  resume should generally stay under ~18-22. If the evidence is thin,
  produce a short, honest one-page resume rather than padding it to look
  fuller.
- mid: target one page, a strict maximum of two if the evidence genuinely
  requires it (multiple substantial roles).
- senior: up to two pages is acceptable when justified by real scope
  (multiple roles, leadership breadth), but do not pad; every extra line
  must still be a distinct, hiring-relevant fact per the density rules below.
Never expand entries with restated or generic content solely to occupy more
vertical space.

═══ VOICE, TENSE & PRONOUNS (CRITICAL) ═══
- Never use first-person pronouns ("I", "my", "me") anywhere in bullets,
  summary_text, or entry text — resumes are written in implied first person
  with the pronoun omitted (e.g. "Built a REST API..." not "I built...").
- Use past tense for every entry that has ended (date_end is in the past or
  a fixed value). Use present tense only for bullets describing the
  candidate's current, ongoing role or ongoing project (date_end is
  "Present" or equivalent).
- Never mix tense within a single bullet or within a single entry's bullet
  list — pick the tense that matches that entry's timeframe and hold it.

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

4. SECTION TITLES MUST BE ATS-STANDARD, NOT CREATIVE. Real applicant tracking
   systems parse resumes by matching section headers against a known
   vocabulary — a clever or personal-brand header ("My Journey", "What I
   Bring", "The Story So Far") will fail to parse and drop that section's
   content from ATS extraction entirely. Use conventional header wording for
   the category the section represents (e.g. "Experience", "Education",
   "Skills", "Certifications", "Projects", "Achievements", "Languages",
   "Publications") even when the template's visual style is bold or modern —
   styling is a layout concern, not a wording concern. Minor natural variants
   are fine (e.g. "Work Experience", "Technical Skills"), but never replace a
   standard header with a marketing-style phrase.
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
  "matched_keywords": ["<keywords/skills from the job description that this resume's content genuinely demonstrates>"],
  "missing_keywords": ["<important job-description keywords/skills the candidate's supplied data does NOT support — for the user to consider adding if true, never to be silently inserted into the resume>"],

  SCORES GUIDELINES:
  - "ai_confidence" must represent confidence in the completeness and interpretation of the supplied candidate data (0-100). Provide an explainable basis or factors used to determine this number in the analysis fields; do NOT use an arbitrary default.
  - "ats_score" must be evidence-based and derived only from observable resume characteristics and the supplied job description (0-100). Never use arbitrary/default scores. If your system computes ATS scores elsewhere, return analysis/factors rather than inventing a final score here.
  - ATS KEYWORD-GAP METHOD (do this explicitly, don't just guess a number): extract the concrete skills, tools, qualifications, and role-specific terms stated in the job description; check each one against what the candidate's supplied data actually supports; list the supported ones in "matched_keywords" and the unsupported-but-relevant ones in "missing_keywords". Base "ats_score" partly on the match ratio between these two lists, not on a vibe. Never add a "missing_keyword" term into the resume body itself — surfacing the gap is the goal, not fabricating the skill.
  - Scores must have an explainable basis; include brief factors or evidence used to compute them.

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
- Start with strong past-tense action verbs that do not exaggerate the candidate's actual responsibility.
- Add metrics ONLY when the original bullet, resume context, or explicitly supplied user information supports them. If no measurable result is available, improve the wording without inventing a metric.
- Use STAR format: Situation → Task → Action → Result, but do not invent results.
- Align keywords with the job description for ATS, but never add a keyword that the candidate does not actually have evidence for in their resume.
- 2-4 bullets per entry maximum
- PLAIN TEXT ONLY — never use markdown formatting (no **bold**, no *italic*, no # headers, no backticks). Every field in the output (bullets, summary_text, titles, subtitles) must be plain prose with no markdown syntax characters at all.

═══ WORD CHOICE — NO REPEATED OR OUTDATED LANGUAGE (CRITICAL) ═══
- Never start two bullets in the same entry, or two entries in the same section, with the same action verb. Track every opening verb you use across the whole resume and vary it — a resume that repeats "Developed... Developed... Developed" reads as low-effort and hurts both ATS parsing and recruiter skim time.
- Do not reuse the same adjective, buzzword, or transition phrase more than once across the entire document (e.g. if "collaborated" is used in Projects, do not reuse it in Skills or Summary — pick a different accurate verb).
- Avoid stale, over-used resume clichés and vague filler that no longer signal anything to a recruiter or ATS parser. Do not use: "hardworking", "team player", "detail-oriented", "results-driven", "go-getter", "self-starter", "dynamic", "passionate", "synergy", "think outside the box", "responsible for", "duties included", "hard worker", "excellent communication skills", "proven track record", "highly motivated", "extensive experience", "wide range of", "utilize"/"utilized" (say "used"), "leverage"/"leveraged" (say "used" or "applied"), "spearheaded" (unless the candidate explicitly led it), "in charge of", "worked closely with", "assisted with".
- Replace vague filler with a specific, current, industry-accurate verb or noun tied to what the candidate actually did (e.g. instead of "responsible for managing a team", write what was actually built, shipped, fixed, or improved, and how, using only supplied facts).
- Prefer concrete, present-day industry terminology over dated jargon (e.g. avoid outdated stack-agnostic phrases like "computer literate", "proficient in Microsoft Office", or "knowledge of internet" unless the candidate is targeting a role where these genuinely matter) — use the actual named tools/technologies/frameworks the candidate supplied instead of a generic catch-all phrase.
- Every bullet across the resume must be distinguishable in substance from every other bullet — if two bullets would say essentially the same thing with different words, cut one or merge them; do not pad the resume with near-duplicate lines.

═══ LOW TEXT, HIGH VALUE OUTPUT (CRITICAL — ATS + RECRUITER SKIM DENSITY) ═══
- Every line must carry a distinct, hiring-relevant fact. If a sentence or bullet could be deleted without losing information a recruiter or ATS would care about, delete it rather than keep it for length.
- Bullets: one idea per bullet, ideally under ~20 words, no compound bullets joined by "and also" or semicolons stacking unrelated facts.
- Summary/Objective (when included): maximum 2-3 sentences, each sentence contributing a fact not stated elsewhere in the resume (no restating the job title, no restating skills that are already listed in the Skills section).
- Do not write introductory throat-clearing ("This project was created in order to..."; "As a fresher, I am eager to..."). Start directly with the action or fact.
- Prefer a single strong, specific bullet over two weak, generic ones covering the same ground.
- Keep formatting ATS-parseable: no tables, icons, columns-as-content, or symbols standing in for words; use plain characters only so applicant tracking systems can read every field correctly.

═══ FACTUAL ACCURACY — NON-NEGOTIABLE ═══
- Use ONLY information supplied by the candidate, the current resume, the job description, or explicit user instruction.
- NEVER invent metrics, percentages, employers, job titles, dates, degrees, certifications, technologies, skills, responsibilities, achievements, awards, leadership experience, project outcomes, languages, or proficiency levels.
- If a measurable result is not provided, improve wording without inventing a number.
- Never turn "worked on" into "led".
- Never turn "participated in" into "managed".
- Never turn "familiar with" into "expert".
- Never claim ownership, leadership, or impact that the source does not support.
- If evidence is missing, preserve the factual limitation rather than guessing.
- Never create a section solely because it is common for a particular career stage.
- Never create placeholder content. Do not output empty sections or fabricated entries.
- Never infer an achievement, leadership, proficiency level, or measurable metric from a job title, seniority, a mentioned technology, or verbs like "improved"/"optimized"/"increased" alone.
- If the candidate provides a project with no result, describe what was actually done rather than inventing an outcome.
- If the candidate provides a skill but no proficiency level, do not claim expert/advanced proficiency unless explicitly supported.
- The selected template affects content density and section emphasis but MUST never change factual content or invent new facts.
- Never automatically add sensitive or unnecessary personal information merely because of the selected country. Only include photo, DOB, nationality, marital status, or other sensitive personal fields when they were supplied by the user and the user explicitly enabled inclusion.

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

function optimizeSectionOrder(data: any, rawData: string): any {
  if (!Array.isArray(data.sections)) return data;
  const profile = detectProfile(rawData);
  const orderByStage: Record<Profile['stage'], string[]> = {
    fresher: ['summary', 'objective', 'education', 'skills', 'skills-tags', 'skills-bars', 'skills-dots', 'projects', 'experience', 'certifications', 'achievements', 'languages'],
    junior: ['summary', 'skills', 'skills-tags', 'skills-bars', 'experience', 'projects', 'education', 'certifications', 'achievements'],
    mid: ['summary', 'experience', 'projects', 'skills', 'skills-tags', 'skills-bars', 'education', 'certifications', 'achievements'],
    senior: ['summary', 'experience', 'leadership', 'achievements', 'skills', 'skills-tags', 'projects', 'education', 'certifications'],
  };
  const preferred = orderByStage[profile.stage];
  const rank = (section: any) => {
    const index = preferred.indexOf(section.type);
    return index === -1 ? preferred.length : index;
  };

  // A student with no work or internship evidence must never receive a
  // professional-experience heading merely because it is conventional.
  if (profile.stage === 'fresher' && !profile.hasExperience && !profile.hasInternship) {
    data.sections = data.sections.filter((section: any) => section.type !== 'experience');
  }

  data.sections.sort((a: any, b: any) => {
    const difference = rank(a) - rank(b);
    return difference || (a.order ?? 99) - (b.order ?? 99);
  });
  data.sections.forEach((section: any, index: number) => {
    section.order = index + 1;
  });
  return data;
}

function extractJson(text: string): any {
  const cleaned = stripJsonFences(text);
  // 1. First, try direct JSON parse
  try {
    return JSON.parse(cleaned);
  } catch (firstErr) {
    const start = cleaned.indexOf('{');
    if (start === -1) {
      const arrayStart = cleaned.indexOf('[');
      if (arrayStart !== -1) {
        try {
          return JSON.parse(cleaned.slice(arrayStart));
        } catch {}
      }
      throw new Error(`AI returned malformed JSON. (${firstErr instanceof Error ? firstErr.message : String(firstErr)})`);
    }

    const slice = cleaned.slice(start);

    const balanceAndSanitize = (str: string): string => {
      let inString = false;
      let isEscaped = false;
      const stack: string[] = [];

      let result = '';
      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (inString) {
          if (isEscaped) {
            isEscaped = false;
            result += ch;
          } else if (ch === '\\') {
            isEscaped = true;
            result += ch;
          } else if (ch === '"') {
            inString = false;
            result += ch;
          } else if (ch === '\n') {
            result += '\\n';
          } else if (ch === '\r') {
            // drop carriage return
          } else if (ch === '\t') {
            result += '\\t';
          } else {
            result += ch;
          }
        } else {
          if (ch === '"') {
            inString = true;
            result += ch;
          } else if (ch === '{' || ch === '[') {
            stack.push(ch);
            result += ch;
          } else if (ch === '}') {
            if (stack.length > 0 && stack[stack.length - 1] === '{') stack.pop();
            result += ch;
          } else if (ch === ']') {
            if (stack.length > 0 && stack[stack.length - 1] === '[') stack.pop();
            result += ch;
          } else {
            result += ch;
          }
        }
      }

      if (inString) {
        if (result.endsWith('\\')) result = result.slice(0, -1);
        result += '"';
      }

      // Clean trailing commas before closing braces/brackets
      result = result.replace(/,\s*([\}\]])/g, '$1');
      result = result.replace(/,\s*$/g, '');

      while (stack.length > 0) {
        const open = stack.pop();
        result = result.replace(/,\s*$/g, '');
        if (open === '{') result += '}';
        else if (open === '[') result += ']';
      }

      return result;
    };

    const sanitizeQuotes = (str: string) => {
      return str
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/,\s*([\}\]])/g, '$1')
        .replace(/\.\.\./g, '');
    };

    // Try parsing balanced string
    const balanced = balanceAndSanitize(slice);
    try {
      return JSON.parse(balanced);
    } catch {}

    const fixed = sanitizeQuotes(balanced);
    try {
      return JSON.parse(fixed);
    } catch {}

    // Looser regex fallback
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        try {
          return JSON.parse(balanceAndSanitize(match[0]));
        } catch {}
      }
    }

    const message = firstErr instanceof Error ? firstErr.message : String(firstErr);
    throw new Error(`AI returned malformed JSON. Please try again. (${message})`);
  }
}

export async function generateResume(
  rawData: string,
  jobDescription: string,
  country: string,
  role: string,
  templateId?: string
): Promise<any> {
  if (!rawData.trim()) throw new Error('Career data is required.');

  const prompt = buildResumePrompt(rawData, jobDescription, country, role, templateId);
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
    const result = await generateWithFallback([{ role: 'user', parts: [{ text: prompt }] }], generationConfig);
    rawText = result.response.text().trim();
  } catch (err: any) {
    throw new Error(`Resume generation failed: ${err.message ?? err}`);
  }

  const data = optimizeSectionOrder(sanitizeTextFields(dropEmptySections(extractJson(rawText))), rawData);
  if (Array.isArray(data.sections)) {
    data.sections.sort((a: any, b: any) => (a.order ?? 99) - (b.order ?? 99));
  }
  return data;
}

export async function enhanceBullet(bullet: string, context = ''): Promise<string> {
  if (!bullet.trim()) return bullet;

  const model = getModel();
  const prompt = `Rewrite this resume bullet point to make it concise, impactful, and professional for recruiters and ATS parsers.

Context: ${context || 'General professional experience'}
Original Bullet: ${bullet}

CRITICAL RULES:
1. Start with a strong, precise past-tense action verb (e.g. Architected, Streamlined, Spearheaded, Implemented) that accurately reflects the candidate's actual responsibility without exaggerating ownership.
2. PRESERVE FACTUAL ACCURACY: NEVER invent numbers, percentages, team sizes, dollar amounts, tools, or outcomes that are not present in the original bullet or context.
3. If the bullet would be stronger with a metric but none is present, write a strong, clear bullet describing the action and outcome truthfully. Do NOT fabricate numbers like "by 25%" or "improved efficiency by X%".
4. If a measurable result is absent and would genuinely elevate the bullet, you may append: "(Consider adding a metric if you have evidence for it.)"
5. Return ONLY the final improved bullet string. No markdown quotes, no explanations, no preamble.`;

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

FACTUAL ACCURACY: Preserve all factual claims unless the user explicitly supplies a replacement fact. Never fabricate metrics, employers, titles, dates, credentials, tools, or outcomes. If asked to tailor for a job description, only reframe and reorder evidence already in the resume; do not claim an unlisted skill or responsibility.
- Global factual-integrity rules (apply everywhere: resume generation, chat edits, bullet edits, analysis, and cover letters):
  - Use ONLY information supplied by the candidate, the current resume, the job description, or explicit user instruction.
  - NEVER invent metrics, percentages, employers, job titles, dates, degrees, certifications, technologies, skills, responsibilities, achievements, awards, leadership experience, project outcomes, languages, or proficiency levels.
  - If a measurable result is not provided, improve wording without inventing a number.
  - Never turn "worked on" into "led".
  - Never turn "participated in" into "managed".
  - Never turn "familiar with" into "expert".
  - Never claim ownership, leadership, or impact that the source does not support.
  - If evidence is missing, preserve the factual limitation rather than guessing.
  - Factual accuracy is more important than making the resume sound impressive.

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
   - "Add metrics to bullets" → Add metrics ONLY when supported by existing resume data or information explicitly supplied by the user. Never invent numbers.
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
 * Public entry point — wraps chatEditResumeOnce with a single automatic retry.
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

  const prompt = `You are QuantumCV's expert resume analysis engine. Analyze this resume and generate concrete, evidence-based, prioritized improvement recommendations.

CRITICAL ENGINE GUIDELINES:
1. Analyze the actual resume content first. Cite exact sections, entries, and bullets where problems exist.
2. DO NOT automatically recommend a professional summary or objective. Only recommend one if there is a clear reason (e.g. career pivot or multidisciplinary background) and explain that reason.
3. Prioritize by actual impact:
   - Critical: factual errors, technical terminology mistakes (e.g., "Javascript" -> "JavaScript", "Reactjs" -> "React", "NodeJS" -> "Node.js", "Github" -> "GitHub", "PostgreSQL", "AWS"), major ATS parse issues, missing essential contact/dates, credibility issues.
   - High: weak bullets lacking evidence/outcomes, unclear achievements, missing relevant proof.
   - Medium: skills grouping, section ordering, concise wording.
   - Low: optional stylistic polish.
4. Distinguish between:
   - Immediate fix: solvable right now from existing resume content.
   - Missing info: details candidate must provide (with specific guidance on what to collect).
   - Role dependent: depends on target job requirements.
5. NEVER invent metrics, achievements, responsibilities, technologies, or outcomes. If a metric would strengthen a bullet, say: "Consider adding a metric if you have evidence for it."
6. Provide concrete before/after examples for weak bullets without fabricated numbers.
7. Group repetitive issues across bullets into single actionable recommendations.
8. Separate "must_fix" from "nice_to_have".

RESUME DATA:
${JSON.stringify(resumeData, null, 2).slice(0, 12000)}

Return ONLY a valid JSON object matching this schema:
{
  "overall_score": 78,
  "ats_readiness": 82,
  "must_fix_count": 2,
  "nice_to_have_count": 3,
  "top_5_improvements": [
    {
      "rank": 1,
      "priority": "Critical | High | Medium",
      "title": "Short title",
      "problem_found": "Specific problem observed in resume",
      "why_it_matters": "Why recruiters or ATS care",
      "action_type": "immediate_fix | missing_information | role_dependent",
      "how_to_fix": "Concrete action to take",
      "location": "Section or bullet reference"
    }
  ],
  "critical_issues": [
    {
      "type": "terminology_mistake | factual_error | major_ats_problem | missing_essential_info | credibility_issue | date_inconsistency",
      "title": "Title",
      "problem_found": "Observed issue",
      "why_it_matters": "Explanation",
      "how_to_fix": "Fix instructions",
      "location": "Location"
    }
  ],
  "content_impact_improvements": [
    {
      "title": "Title",
      "location": "Location",
      "issue_identified": "Specific weakness",
      "why_it_matters": "Recruiter impact",
      "how_to_fix": "Guidance",
      "before_after_examples": [
        {
          "original": "Original text",
          "improved": "Truthful improved text",
          "why_improved": "Explanation",
          "metric_guidance": "Consider adding a metric if you have evidence for it."
        }
      ]
    }
  ],
  "ats_improvements": {
    "parseability_status": "Good | Needs Attention | Critical",
    "formatting_risks": ["Specific formatting risks"],
    "section_header_feedback": ["Header recommendations"],
    "keyword_strategy": "Non-stuffed ATS keyword guidance"
  },
  "section_optimization": [
    {
      "section_name": "Section Name",
      "action": "keep | remove | shorten | reorder | strengthen",
      "reason": "Why this section should change",
      "why_it_matters": "Impact on recruiter reading flow",
      "recommendation": "What to do"
    }
  ],
  "missing_information": [
    {
      "item_to_provide": "Exact metric, date, or evidence needed",
      "why_needed": "Why it strengthens the resume",
      "suggested_prompt": "Question for the candidate",
      "target_section": "Where to add it"
    }
  ],
  "quick_wins": ["List of 2-4 immediate one-minute fixes"],
  "suggestions": {
    "bullets": ["Bullet improvement note"],
    "structure": ["Structure note"],
    "keywords": ["Keyword note"],
    "format": ["Format note"]
  }
}`;

  try {
    const run = async (instructionPrompt: string, maxTokens = 3500) => {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: instructionPrompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens, responseMimeType: 'application/json' },
      });
      return extractJson(result.response.text().trim());
    };

    const report = await run(prompt, 3500);
    const valid = report && typeof report.overall_score === 'number' && (Array.isArray(report.top_5_improvements) || Array.isArray(report.quick_wins));
    if (valid) return report;

    // Retry with compact instruction
    const compact = prompt + '\n\nRETRY: Return ONLY valid JSON matching the schema. Limit lists to 4 items and ensure JSON parses properly.';
    try {
      const retryReport = await run(compact, 2500);
      if (retryReport && typeof retryReport.overall_score === 'number') return retryReport;
      console.warn('Resume analysis returned invalid schema on retry, falling back.');
      return { error: 'Analysis returned unexpected format' };
    } catch (retryErr) {
      console.error('Analysis retry failed:', retryErr);
      return { error: 'Could not analyze resume' };
    }
  } catch (err) {
    console.error('Analysis error:', err);
    return { error: 'Could not analyze resume' };
  }
}

function fallbackReviewToReport(
  resumeInput: any,
  role?: string,
  jobDescription?: string
) {
  const review = reviewResume(resumeInput, role, jobDescription);

  const score_breakdown = [
    { label: 'ATS compatibility', score: review.ats, reason: 'Evaluated ATS header parseability, keyword frequency, and standard section formatting.', evidence: [] },
    { label: 'Role alignment', score: jobDescription ? review.ats : null, reason: jobDescription ? 'Evaluated direct skill overlap with target role job description.' : 'Role-specific evaluation is unavailable without a job description.', evidence: [] },
    { label: 'Impact evidence', score: review.impact, reason: 'Evaluated active verbs, STAR structure, and truthful metric guidance.', evidence: [] },
    { label: 'Content quality', score: review.content, reason: 'Evaluated technical terminology casing, typo scanner, and grammar consistency.', evidence: [] },
    { label: 'Structure & readability', score: review.structure, reason: 'Evaluated section layout, entry grouping, and recruiter scan hierarchy.', evidence: [] },
  ];

  const recruiterReview = review.recruiter_review || {
    first_impression: 'Scannable resume with clear core technical skills. Immediate readability is strong.',
    strengths: review.strengths.slice(0, 4),
    concerns: review.issues.filter((i) => i.severity === 'high').map((i) => i.title).slice(0, 3),
    interview_probability: review.overall >= 80 ? 'Strong' : review.overall >= 65 ? 'Moderate' : 'Needs Polish',
    likely_recruiter_questions: [
      'Can you walk me through the architecture and scale of your primary project?',
      'What specific tools or workflows did you own directly in your day-to-day work?',
    ],
  };

  if (!recruiterReview.concerns || recruiterReview.concerns.length === 0 || recruiterReview.concerns.every((c) => !c || c.trim() === '-' || c.trim() === '')) {
    recruiterReview.concerns = ['No major recruiter-facing issues identified.'];
  }

  return {
    overall_score: review.overall,
    verdict: review.career_stage === 'senior_lead'
      ? 'Senior candidate profile with leadership experience; focus on quantifying business outcomes and technical architecture scale.'
      : review.career_stage === 'student_fresher'
      ? 'Strong educational and project foundation; focus on highlighting technical deliverables and standardizing technical terminology.'
      : 'Solid technical background; prioritize replacing passive responsibility phrasing with active STAR achievement bullets.',
    executive_summary: review.executive_summary || review.career_stage_context,
    career_stage: review.career_stage,
    career_stage_context: review.career_stage_context,
    analysis_confidence: review.analysis_confidence,
    analysis_confidence_note: review.analysis_confidence_note,
    detected_structure: review.detected_structure,
    must_fix_count: review.must_fix_count,
    nice_to_have_count: review.nice_to_have_count,
    score_breakdown,
    top_5_improvements: review.top_5_improvements,
    critical_issues: review.critical_issues,
    content_impact_improvements: review.content_impact_improvements,
    ats_improvements: review.ats_improvements,
    role_specific_improvements: review.role_specific_improvements,
    section_optimization: review.section_optimization,
    candidate_information_needed: review.candidate_information_needed,
    recruiter_review: recruiterReview,
    priority_fixes: review.top_5_improvements.map((i) => ({
      priority: i.priority,
      title: i.title,
      why_it_matters: i.why_it_matters,
      how_to_fix: i.how_to_fix,
    })),
    rewrite_examples: review.content_impact_improvements.flatMap((c) => c.before_after_examples || []).map((ex) => ({
      original: ex.original,
      improved: ex.improved,
      why: ex.why_improved,
    })),
    missing_information: review.candidate_information_needed.map((c) => `${c.item_to_provide}: ${c.suggested_prompt}`),
    next_steps: [
      'Fix any critical terminology casing or typos highlighted in Section B.',
      'Apply suggested active STAR rewrites for passive bullets in QuantumCV Builder.',
      'Add truthful scale or metric indicators where you have verifiable project evidence.',
    ],
  };
}

export async function analyzeResumeDeep({
  resumeData,
  resumeText,
  document,
  role,
  jobDescription,
}: {
  resumeData?: unknown;
  resumeText?: string;
  document?: { base64: string; mimeType: string; name: string };
  role?: string;
  jobDescription?: string;
}) {
  const hasRoleOrJD = Boolean((role && role.trim()) || (jobDescription && jobDescription.trim()));
  const extractedDocText = document ? extractTextFromDocument(document) : '';
  const effectiveResumeText = resumeText || extractedDocText;

  const prompt = `You are QuantumCV's senior hiring manager and ATS intelligence engine. Produce a rigorous, evidence-based, prioritized resume evaluation and improvement plan.

CRITICAL OPERATIONAL RULES:
1. ANALYZE ACTUAL CONTENT FIRST: Identify concrete weaknesses, inconsistencies, missing information, weak wording, formatting problems, and opportunities for improvement rooted in the actual text. Never generate generic boilerplate.
2. GENERAL RESUME ANALYSIS WITHOUT A JD: Even when NO Job Description is provided, perform a complete, deep general resume review (weak wording, passive/unclear ownership, technical terminology, inconsistent formatting, unclear projects, weak evidence, readability, credibility, and ATS parsing). Do NOT treat absence of a JD as a candidate defect or include "Provide a target JD" in top improvements.
3. PRIORITIZE BY ACTUAL IMPACT:
   - Critical: actual factual errors, technical terminology mistakes, major ATS parse blockers, missing essential dates/contact, credibility issues.
   - High: weak experience/project bullets, unclear achievements, missing relevant evidence in specific bullets.
   - Medium: skills organization, section ordering, wording conciseness.
   - Low: optional polishing.
4. EVIDENCE-BASED: Cite specific text, bullets, or sections actually found in the resume.
5. DISTINGUISH ACTION TYPES: "immediate_fix" | "missing_information" | "role_dependent".
6. NEVER INVENT METRICS OR ACHIEVEMENTS: If a bullet would be stronger with a metric that is absent, say: "Consider adding a verified metric if you have evidence." Do not fabricate numbers.
7. DETECT FACTUAL & TERMINOLOGY ERRORS: Standardize casing (e.g. "JavaScript", "TypeScript", "Node.js", "React", "Next.js", "GitHub", "PostgreSQL", "AWS", "Kubernetes", "Docker", "RESTful APIs", "GraphQL", "PyTorch", "TensorFlow") and identify typos or reversed dates.
8. ROBUST SECTION RECOGNITION (CRITICAL):
   - Recognize common standard headings: "EDUCATION", "ACADEMIC QUALIFICATIONS", "TECHNICAL SKILLS", "SKILLS", "EXPERIENCE", "WORK EXPERIENCE", "PROFESSIONAL EXPERIENCE", "EMPLOYMENT", "WORK HISTORY", "INTERNSHIP EXPERIENCE", "PROJECTS", "POSITIONS OF RESPONSIBILITY", "LEADERSHIP", "ACHIEVEMENTS & AWARDS", "CERTIFICATIONS", "PUBLICATIONS", etc.
   - 3 SECTION-DETECTION STATES: DETECTED, NOT_DETECTED, UNCERTAIN.
   - CRITICAL RULE: ONLY NOT_DETECTED may produce a "missing section" recommendation. DETECTED and UNCERTAIN sections must NEVER be reported as missing.
   - If parser confidence is LOW, do not generate critical missing-section recommendations. Parser uncertainty is NEVER a candidate deficiency.
9. RECOGNIZE & CREDIT METRICS: If the resume contains legitimate metrics (percentages, ranks like AIR/Rank, accuracy, team sizes, counts like 800+, currencies like Rs. 3,00,000 / ₹3,00,000 / $50,000, GPA/CPI, throughput/latency, duration), recognize and credit them in strengths instead of claiming the entire resume lacks metrics. Identify specific unquantified bullets that could benefit from verified evidence.
10. TARGET ROLE EVALUATION:
   ${hasRoleOrJD ? `- Evaluate fit, keyword alignment, matching evidence, and gaps thoroughly.` : `- NO target role or Job Description was provided. Set "job_description_provided": false, and set "role_analysis_limited_note": "Role-specific analysis is unavailable without a target role or job description." Do NOT treat absence of a JD as a candidate defect or include it in top improvements.`}
11. BEFORE/AFTER REWRITES: Provide concrete Before/After pairs rewriting actual weak bullets found in the resume without fabricated metrics.
12. CAREER STAGE AWARENESS: Adapt to candidate stage (student_fresher | junior | mid | senior_lead).
13. RECRUITER 6-SECOND GLANCE: Generate specific strengths from actual resume evidence. Generate pauses only when real evidence exists. If no major pauses, set concerns to ["No major recruiter-facing issues identified."]. Never leave an empty bullet. Generate screening questions citing the candidate's actual projects, technologies, and achievements.
14. RECALIBRATE SCORING: High-quality resumes with Education, Projects, Skills, and Achievements must receive appropriate scores (75–95). Do not give artificially low scores due to extraction uncertainty or JD absence.
15. MERGE DUPLICATE RECOMMENDATIONS: Never duplicate metric recommendations or section notices.
16. STRICT EVIDENCE GROUNDING & NO UNFOUNDED INFERENCES:
   - Distinguish Skills from Experience: Listing technologies (e.g., Python, C++, Docker) in a Skills section does NOT mean they were integrated or used together in a project. Never generate statements or questions about multi-technology integrations (e.g. "Python/C++ integration") unless the resume explicitly describes that integration in a project or work experience.
   - Lossless Metrics: Never truncate or corrupt metrics (e.g. "Rs. 3,00,000" must remain "Rs. 3,00,000", NEVER "Rs.3").
   - Screening questions and strengths must reference concrete projects, roles, or validated metrics explicitly described in the resume.

INPUT DATA:
TARGET ROLE: ${role || 'Not provided'}
JOB DESCRIPTION: ${jobDescription || 'Not provided'}
RESUME DATA: ${resumeData ? JSON.stringify(resumeData).slice(0, 14000) : effectiveResumeText ? effectiveResumeText.slice(0, 14000) : 'The attached document is the resume.'}

Return ONLY a valid JSON object matching this exact schema:
{
  "extracted_text": "Plain text of the resume if reading from an attached document",
  "overall_score": 76,
  "verdict": "Single sentence assessment of resume standing.",
  "executive_summary": "2-3 sentences summarizing candidate profile, career stage, and core improvement areas.",
  "career_stage": "student_fresher | junior | mid | senior_lead",
  "career_stage_context": "Explanation of how career stage informed this evaluation.",
  "must_fix_count": 2,
  "nice_to_have_count": 4,
  "score_breakdown": [
    { "label": "ATS compatibility", "score": 80, "reason": "...", "evidence": [] },
    { "label": "Role alignment", "score": ${hasRoleOrJD ? '75' : 'null'}, "reason": "...", "evidence": [] },
    { "label": "Impact evidence", "score": 70, "reason": "...", "evidence": [] },
    { "label": "Content quality", "score": 78, "reason": "...", "evidence": [] },
    { "label": "Structure & readability", "score": 85, "reason": "...", "evidence": [] }
  ],
  "top_5_improvements": [
    {
      "rank": 1,
      "priority": "Critical | High | Medium",
      "title": "Title of improvement",
      "problem_found": "Exact weakness observed with quote/reference",
      "why_it_matters": "Why this matters to recruiters or ATS",
      "action_type": "immediate_fix | missing_information | role_dependent",
      "how_to_fix": "Actionable instructions to resolve",
      "location": "Section or bullet location"
    }
  ],
  "critical_issues": [
    {
      "type": "terminology_mistake | factual_error | major_ats_problem | missing_essential_info | credibility_issue | date_inconsistency",
      "title": "Issue title",
      "problem_found": "Concrete issue found in resume",
      "why_it_matters": "Why this damages credibility or ATS parsing",
      "how_to_fix": "How to fix it immediately",
      "location": "Location in resume"
    }
  ],
  "content_impact_improvements": [
    {
      "title": "Improvement title",
      "location": "Section or entry location",
      "issue_identified": "Weak phrasing or passive verb",
      "why_it_matters": "Recruiter impact",
      "how_to_fix": "STAR-based improvement instructions",
      "before_after_examples": [
        {
          "original": "Actual bullet from resume",
          "improved": "Truthful rewrite using strong action verb without fabricated numbers",
          "why_improved": "Why this rewrite is stronger",
          "metric_guidance": "Consider adding a verified metric if you have evidence."
        }
      ]
    }
  ],
  "ats_improvements": {
    "parseability_status": "Good | Needs Attention | Critical",
    "ats_score_estimate": 82,
    "recruiter_readability_balance": "Readability assessment",
    "formatting_risks": ["Risk 1"],
    "section_header_feedback": ["Header advice"],
    "keyword_strategy": "Keyword integration strategy"
  },
  "role_specific_improvements": {
    "target_role": "${role || ''}",
    "job_description_provided": ${hasRoleOrJD},
    "role_analysis_limited_note": "${hasRoleOrJD ? '' : 'Role-specific analysis is unavailable without a target role or job description.'}",
    "strong_matches": ["Skill or experience matching role"],
    "missing_important_keywords": [
      { "keyword": "Keyword", "importance": "High | Medium", "reason": "Why needed" }
    ],
    "unproven_skills": [
      { "skill": "Skill", "note": "Claimed in skills list but zero project or experience bullets show evidence." }
    ],
    "experiences_to_emphasize": ["Experience to highlight"],
    "unevidenced_claims_to_avoid": ["Caution against unevidenced skills"]
  },
  "section_optimization": [
    {
      "section_name": "Section name",
      "action": "keep | remove | shorten | reorder | strengthen",
      "reason": "Why this action is recommended",
      "why_it_matters": "Impact on resume flow",
      "recommendation": "Concrete change"
    }
  ],
  "candidate_information_needed": [
    {
      "item_to_provide": "Specific metric, scope, or date needed",
      "why_needed": "Why this makes the resume stronger",
      "suggested_prompt": "Question to ask the candidate",
      "target_section": "Target section"
    }
  ],
  "recruiter_review": {
    "first_impression": "6-second recruiter glance impression",
    "strengths": ["Strength 1", "Strength 2"],
    "concerns": ["Concern 1"],
    "interview_probability": "Low | Moderate | Strong",
    "likely_recruiter_questions": ["Recruiter screening question citing candidate's project or skill"]
  }
} `;

  const parts: Part[] = [{ text: prompt }];
  if (document) parts.unshift({ inlineData: { data: document.base64, mimeType: document.mimeType } });

  const computeOverallFromBreakdown = (score_breakdown: any[]) => {
    const weights: Record<string, number> = {
      'ATS compatibility': 0.25,
      'Role alignment': hasRoleOrJD ? 0.2 : 0,
      'Impact evidence': 0.25,
      'Content quality': 0.2,
      'Structure & readability': 0.1,
    };

    const labelToScore: Record<string, number> = {};
    for (const item of score_breakdown || []) {
      if (item && typeof item.label === 'string' && typeof item.score === 'number') {
        labelToScore[item.label] = item.score;
      }
    }

    let totalWeight = 0;
    let weightedSum = 0;
    for (const [label, w] of Object.entries(weights)) {
      if (label in labelToScore && typeof labelToScore[label] === 'number') {
        totalWeight += w;
        weightedSum += labelToScore[label] * w;
      }
    }

    if (totalWeight === 0) {
      const vals = Object.values(labelToScore).filter((v) => typeof v === 'number');
      if (vals.length === 0) return 75;
      return Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length);
    }
    return { overall: Math.round(weightedSum / totalWeight), weights_used: weights };
  };

  const findNumbersAndRiskyPhrases = (text: string) => {
    const numbers = Array.from(text.matchAll(/\b\d+(?:%|\+)?\b/g)).map((m) => m[0]);
    const risky = [] as string[];
    const lower = text.toLowerCase();
    ['high-speed', 'groundbreaking', 'industry-leading', 'exceptional', 'unprecedented', 'significant', 'substantial'].forEach((p) => {
      if (lower.includes(p)) risky.push(p);
    });
    return { numbers, risky };
  };

  const checkRewriteSafety = (original: string, improved: string, resumeTextUnion: string) => {
    const origNums = new Set(findNumbersAndRiskyPhrases(original).numbers);
    const imp = findNumbersAndRiskyPhrases(improved);
    const resumeNums = new Set(findNumbersAndRiskyPhrases(resumeTextUnion).numbers);

    const introducedNumbers = imp.numbers.filter((n) => !origNums.has(n) && !resumeNums.has(n));
    const introducedRisky = imp.risky.filter((p) => !original.toLowerCase().includes(p) && !resumeTextUnion.toLowerCase().includes(p));

    return { safe: introducedNumbers.length === 0 && introducedRisky.length === 0, introducedNumbers, introducedRisky };
  };

  const normalizeReport = (report: any) => {
    const r = Object.assign({}, report);

    const breakdown = Array.isArray(r.score_breakdown) ? r.score_breakdown : [];
    r.score_breakdown = breakdown;

    const overallCalc = computeOverallFromBreakdown(breakdown);
    if (overallCalc && typeof overallCalc === 'object') {
      r.computed_overall = overallCalc.overall;
      r.overall_score = r.overall_score ?? overallCalc.overall;
      r.overall_calculation = { weights: overallCalc.weights_used };
    } else if (typeof overallCalc === 'number') {
      r.computed_overall = overallCalc;
      r.overall_score = r.overall_score ?? overallCalc;
      r.overall_calculation = { auto_averaged: true };
    }

    const resumeStr = getResumeText((resumeData as any) || effectiveResumeText || r.extracted_text || '');
    const resumeUnion = `${JSON.stringify(resumeData ?? '')} ${resumeStr}`;

    // Normalize top 5 improvements & strip JD absence recommendations
    if (!Array.isArray(r.top_5_improvements) || r.top_5_improvements.length === 0) {
      if (Array.isArray(r.priority_fixes) && r.priority_fixes.length > 0) {
        r.top_5_improvements = r.priority_fixes.slice(0, 5).map((fix: any, index: number) => ({
          rank: index + 1,
          priority: fix.priority || 'High',
          title: fix.title || 'Improvement',
          problem_found: fix.why_it_matters || '',
          why_it_matters: fix.why_it_matters || '',
          action_type: 'immediate_fix',
          how_to_fix: fix.how_to_fix || '',
          location: 'Resume',
        }));
      } else {
        r.top_5_improvements = [];
      }
    } else {
      r.top_5_improvements = r.top_5_improvements.slice(0, 5).map((item: any, idx: number) => ({
        rank: item.rank || idx + 1,
        priority: item.priority || 'High',
        title: item.title || `Improvement #${idx + 1}`,
        problem_found: item.problem_found || '',
        why_it_matters: item.why_it_matters || '',
        action_type: item.action_type || 'immediate_fix',
        how_to_fix: item.how_to_fix || '',
        location: item.location || 'Resume',
      }));
    }

    // Filter any JD-absence recommendations from top improvements
    r.top_5_improvements = r.top_5_improvements.filter(
      (item: any) => !/job\s*description|target\s*role|tailored\s*matching/i.test(item.title) &&
                     !/no\s+target\s+role\s+or\s+job\s+description\s+was\s+supplied/i.test(item.problem_found)
    );

    // Bridge priority_fixes from top_5_improvements
    r.priority_fixes = r.top_5_improvements.map((item: any) => ({
      priority: item.priority || 'High',
      title: item.title,
      why_it_matters: item.why_it_matters,
      how_to_fix: item.how_to_fix,
    }));

    // Normalize critical issues
    if (!Array.isArray(r.critical_issues)) {
      r.critical_issues = [];
    }

    // Normalize content impact improvements & rewrites
    if (!Array.isArray(r.content_impact_improvements)) {
      r.content_impact_improvements = [];
    }

    // Check rewrite safety on rewrite_examples and content_impact_improvements
    if (Array.isArray(r.rewrite_examples)) {
      r.rewrite_examples = r.rewrite_examples.map((ex: any) => {
        try {
          const original = String(ex.original ?? '');
          const improved = String(ex.improved ?? '');
          const check = checkRewriteSafety(original, improved, resumeUnion);
          return Object.assign({}, ex, { safe: check.safe, introduced_numbers: check.introducedNumbers, risky_phrases_introduced: check.introducedRisky });
        } catch {
          return Object.assign({}, ex, { safe: null });
        }
      });
    }

    // Populate rewrite_examples from content_impact_improvements if empty
    if ((!Array.isArray(r.rewrite_examples) || r.rewrite_examples.length === 0) && r.content_impact_improvements.length > 0) {
      const rewrites: any[] = [];
      for (const item of r.content_impact_improvements) {
        if (Array.isArray(item.before_after_examples)) {
          for (const ex of item.before_after_examples) {
            rewrites.push({ original: ex.original, improved: ex.improved, why: ex.why_improved || item.why_it_matters });
          }
        }
      }
      r.rewrite_examples = rewrites;
    }

    // Normalize role specific improvements (Requirements 2 & 5)
    if (!r.role_specific_improvements || typeof r.role_specific_improvements !== 'object') {
      r.role_specific_improvements = {
        target_role: role || '',
        job_description_provided: hasRoleOrJD,
        role_analysis_limited_note: hasRoleOrJD ? '' : 'Role-specific analysis is unavailable without a target role or job description.',
        strong_matches: [],
        missing_important_keywords: [],
        unproven_skills: [],
        experiences_to_emphasize: [],
        unevidenced_claims_to_avoid: [],
      };
    } else {
      if (!hasRoleOrJD) {
        r.role_specific_improvements.job_description_provided = false;
        r.role_specific_improvements.role_analysis_limited_note =
          'Role-specific analysis is unavailable without a target role or job description.';
      } else {
        r.role_specific_improvements.job_description_provided = true;
      }
    }

    // Normalize candidate_information_needed and missing_information
    if (Array.isArray(r.candidate_information_needed)) {
      if (!Array.isArray(r.missing_information) || r.missing_information.length === 0) {
        r.missing_information = r.candidate_information_needed.map((info: any) =>
          typeof info === 'string' ? info : `${info.item_to_provide}: ${info.why_needed || info.suggested_prompt || ''}`
        );
      }
    } else if (Array.isArray(r.missing_information)) {
      r.candidate_information_needed = r.missing_information.map((item: string) => ({
        item_to_provide: item,
        why_needed: 'Provides critical factual evidence for resume strength',
        suggested_prompt: `Can you provide specific details or metrics for: ${item}?`,
        target_section: 'Experience / Projects',
      }));
    } else {
      r.candidate_information_needed = [];
      r.missing_information = [];
    }

    // Normalize section_optimization
    if (!Array.isArray(r.section_optimization)) {
      r.section_optimization = [];
    }

    // Structure & Metrics & Evidence Map Detection layer
    const structure = parseResumeStructure(resumeStr);
    const { hasMetrics } = detectResumeMetrics(resumeStr);
    const evidenceMap = buildEvidenceMap(resumeStr, typeof resumeData === 'object' ? resumeData : undefined, structure);
    r.detected_structure = structure;
    r.evidence_map = evidenceMap;

    const baseReview = reviewResume(resumeStr, role, jobDescription);
    r.analysis_confidence = r.analysis_confidence || baseReview.analysis_confidence;
    r.analysis_confidence_note = r.analysis_confidence_note || baseReview.analysis_confidence_note;

    // Recruiter Review normalization
    if (!r.recruiter_review || typeof r.recruiter_review !== 'object') {
      r.recruiter_review = baseReview.recruiter_review || {
        first_impression: 'Resume demonstrates relevant background with clear actionable areas for impact enhancement.',
        strengths: ['Clear core skill categorization', 'Relevant project/work history'],
        concerns: ['No major recruiter-facing issues identified.'],
        interview_probability: (r.overall_score || 70) >= 80 ? 'Strong' : 'Moderate',
        likely_recruiter_questions: ['Can you describe the primary technical challenge on your most recent project?'],
      };
    }

    // Apply strict evidence grounding and validation to eliminate hallucinations
    const groundedReport = validateAndGroundAnalysis(r, evidenceMap);
    r.recruiter_review = groundedReport.recruiter_review;

    // Apply Consistency & Policy Validation
    const consistentReview = runConsistencyCheck(
      {
        overall: r.overall_score || 75,
        ats: r.score_breakdown.find((s: any) => s.label === 'ATS compatibility')?.score || 75,
        content: r.score_breakdown.find((s: any) => s.label === 'Content quality')?.score || 75,
        impact: r.score_breakdown.find((s: any) => s.label === 'Impact evidence')?.score || 75,
        structure: r.score_breakdown.find((s: any) => s.label === 'Structure & readability')?.score || 80,
        career_stage: r.career_stage || baseReview.career_stage,
        career_stage_context: r.career_stage_context || baseReview.career_stage_context,
        must_fix_count: r.critical_issues.length,
        nice_to_have_count: r.top_5_improvements.length,
        strengths: [],
        issues: [],
        missingKeywords: [],
        actionVerbs: [],
        analysis_confidence: r.analysis_confidence,
        analysis_confidence_note: r.analysis_confidence_note,
        detected_structure: structure,
        top_5_improvements: r.top_5_improvements,
        critical_issues: r.critical_issues,
        content_impact_improvements: r.content_impact_improvements,
        ats_improvements: r.ats_improvements || baseReview.ats_improvements,
        role_specific_improvements: r.role_specific_improvements,
        section_optimization: r.section_optimization,
        candidate_information_needed: r.candidate_information_needed,
      },
      structure,
      hasMetrics
    );

    r.critical_issues = consistentReview.critical_issues;
    r.top_5_improvements = consistentReview.top_5_improvements;
    r.content_impact_improvements = consistentReview.content_impact_improvements;
    r.must_fix_count = consistentReview.must_fix_count;
    r.nice_to_have_count = consistentReview.nice_to_have_count;

    if (!Array.isArray(r.recruiter_review.concerns) || r.recruiter_review.concerns.length === 0 || r.recruiter_review.concerns.every((c: any) => !c || String(c).trim() === '-' || String(c).trim() === '')) {
      r.recruiter_review.concerns = ['No major recruiter-facing issues identified.'];
    }

    if (!Array.isArray(r.next_steps) || r.next_steps.length === 0) {
      r.next_steps = [
        'Apply the top 5 high-value fixes in QuantumCV Builder.',
        'Review Section B critical issues to ensure all technical terms have standardized casing.',
        'Add verifiable project scale or metrics where available.',
      ];
    }

    return r;
  };

  const executeWithTimeout = async <T>(promise: Promise<T>, timeoutMs = 25000): Promise<T> => {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`AI request timed out after ${timeoutMs / 1000}s`)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
  };

  try {
    const aiCall = async () => {
      const result = await generateWithFallback(
        [{ role: 'user', parts }],
        { temperature: 0.2, maxOutputTokens: 5000, responseMimeType: 'application/json' }
      );
      return extractJson(result.response.text().trim());
    };

    const primary = await executeWithTimeout(aiCall(), 28000);
    const ok = primary && typeof primary.overall_score === 'number';
    if (ok) return normalizeReport(primary);

    console.warn('Primary analysis returned invalid structure, falling back to deterministic review.');
    return fallbackReviewToReport(resumeData || effectiveResumeText || '', role, jobDescription);
  } catch (err) {
    console.warn('AI deep analysis encountered an issue, seamlessly falling back to deterministic engine:', err);
    return fallbackReviewToReport(resumeData || effectiveResumeText || '', role, jobDescription);
  }
}

export async function generateCoverLetter(
  resumeData: any,
  jobDescription: string
): Promise<string> {
  if (!jobDescription.trim()) throw new Error('Job description is required.');

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
2. Highlights relevant experience, using metrics ONLY when those metrics are explicitly present in the resume or job description; otherwise describe achievements without inventing numbers
3. Shows alignment with company values only when that alignment is directly supported by the resume or job description; do not claim shared values without evidence
4. Closes with a concise call to action

FACTUAL ACCURACY:
- Use only facts present in the resume and job description.
- Never invent metrics, achievements, responsibilities, projects, technologies, company values, or experience.
- If the resume contains no metric for an achievement, describe it without a number.
- Do not claim the candidate shares a company value unless the provided information supports that connection.
- Do not invent personal knowledge of the company.
- Do not invent placeholders or unsupported claims.

WORD CHOICE — NO CLICHÉS OR REPEATED LANGUAGE:
- Do not use: "hardworking", "team player", "detail-oriented", "results-driven", "passionate", "proven track record", "highly motivated", "extensive experience", "wide range of", "utilize"/"utilized", "leverage"/"leveraged", "excellent communication skills", "dynamic", "synergy", "go-getter", "self-starter".
- Do not open more than one sentence with the same subject/verb pattern ("I have... I have... I am..."); vary sentence openings across the letter.
- Do not repeat the same descriptive word (e.g. an adjective describing a skill or the company) more than once across the letter.
- Every sentence must add a fact or reason not already stated elsewhere in the letter — cut any sentence that only restates the opening enthusiasm or the resume's contents without adding something new.

The cover letter should be persuasive through accurate relevance, not fabricated achievements. Professional tone, no placeholder brackets.`;

  try {
    const result = await generateWithFallback(
      [{ role: 'user', parts: [{ text: prompt }] }],
      { temperature: 0.4, maxOutputTokens: 800 }
    );
    return result.response.text().trim();
  } catch (err: any) {
    throw new Error(`Failed to generate cover letter: ${err.message ?? err}`);
  }
}