/** Server-only prompt builders for the free tools. */
import type { ToolSlug } from './tools-config';

const RULES = `HARD RULES:
- Use only facts the user supplied. NEVER invent employers, tools, numbers, percentages, team sizes or outcomes.
- Where a metric would strengthen a statement and none was given, use a bracketed placeholder such as [X%] or [number of users] so the user can fill in a real figure.
- Plain, professional English. No clichés ("hardworking", "team player", "passionate", "results-driven", "dynamic").
- Output ONLY valid JSON matching the requested shape. No markdown fences.`;

export function buildToolPrompt(slug: ToolSlug, v: Record<string, string>): { prompt: string; json: boolean; maxTokens: number } {
  switch (slug) {
    case 'resume-bullet-point-generator':
      return {
        json: true,
        maxTokens: 2500,
        prompt: `You are an expert resume writer for ${v.level || 'early-career'} candidates.
Rewrite each duty below as a strong resume bullet for the role "${v.role}". Each bullet: starts with a precise past-tense action verb (present tense only if clearly ongoing), names the tool/technique if given, and ends with the outcome or purpose (STAR style, one line, max ~28 words).
${RULES}

DUTIES (one per line):
${v.duties}

Return: {"bullets":[{"original":"...","improved":"...","metric_tip":"short tip on what real number to add, or empty"}]}`,
      };
    case 'ats-keyword-generator':
      return {
        json: true,
        maxTokens: 2500,
        prompt: `You are an ATS (applicant tracking system) analyst. Extract the keywords a recruiter's ATS would screen for from this job description${v.role ? ` for "${v.role}"` : ''}.
Use the exact wording and casing from the posting. Deduplicate. Do not add skills that are not implied by the text.
${RULES}

JOB DESCRIPTION:
${v.jobDescription}

Return: {"must_have":["..."],"nice_to_have":["..."],"hard_skills":["..."],"tools_and_tech":["..."],"soft_skills":["..."],"action_phrases":["phrases worth mirroring"],"resume_tip":"one specific sentence on how to place these keywords"}`,
      };
    case 'resume-summary-generator':
      return {
        json: true,
        maxTokens: 1800,
        prompt: `Write resume summaries for a ${v.level || 'candidate'} targeting "${v.role}".
Skills: ${v.skills || 'not given'}
Background:
${v.highlights}

Produce 3 summaries in different styles (40–60 words each, implied first person — never start with "I"), plus one 1–2 sentence career objective suitable for entry-level applications.
${RULES}

Return: {"summaries":[{"style":"Achievement-led","text":"..."},{"style":"Skills-led","text":"..."},{"style":"Concise","text":"..."}],"objective":"..."}`,
      };
    case 'cover-letter-generator':
      return {
        json: false,
        maxTokens: 1200,
        prompt: `Write a cover letter for the role "${v.role}"${v.company ? ` at ${v.company}` : ''}.
Structure: 3–4 short paragraphs, 250–330 words. Open with specific interest in the role (no generic enthusiasm), connect the 2–3 most relevant experiences or projects from the resume to the requirements in the job description, close with a concise call to action. Address "Dear Hiring Manager," and end "Sincerely," with the candidate's name if it appears in the resume.
Use ONLY facts from the resume and job description. Never invent metrics, achievements or company values. No placeholder brackets. Avoid clichés ("passionate", "hardworking", "team player", "proven track record", "leverage", "utilize").

RESUME:
${v.resume}

JOB DESCRIPTION:
${v.jobDescription}

Return only the letter text.`,
      };
  }
}
