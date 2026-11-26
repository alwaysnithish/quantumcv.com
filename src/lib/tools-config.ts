/**
 * src/lib/tools-config.ts
 * Single source of truth for the 4 SEO mini-tools: page copy, SEO metadata,
 * form fields and FAQs. (Prompts live server-side in lib/tools-prompts.ts.)
 */
import { SITE_URL } from './credit-config';

export type ToolSlug =
  | 'resume-bullet-point-generator'
  | 'ats-keyword-generator'
  | 'resume-summary-generator'
  | 'cover-letter-generator';

export interface ToolField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
  rows?: number;
  required?: boolean;
  maxLength: number;
}

export interface ToolConfig {
  slug: ToolSlug;
  navTitle: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  intro: string;
  fields: ToolField[];
  cta: string;
  faqs: { q: string; a: string }[];
  howItWorks: string[];
}

export const TOOLS: ToolConfig[] = [
  {
    slug: 'resume-bullet-point-generator',
    navTitle: 'Bullet Point Generator',
    h1: 'AI Resume Bullet Point Generator',
    metaTitle: 'Free AI Resume Bullet Point Generator (STAR Method)',
    metaDescription:
      'Turn weak job or project duties into strong, action-verb-led STAR resume bullet points in seconds. Free, no signup needed — built for freshers and students.',
    keywords: ['resume bullet point generator', 'resume bullet points for freshers', 'STAR method resume bullets', 'action verbs for resume', 'AI resume bullet points'],
    intro:
      'Paste what you actually did — even if it sounds boring — and get recruiter-ready bullets that start with a strong action verb and follow the STAR pattern. We never invent numbers: where a metric would help, you get a [placeholder] to fill with your real figure.',
    fields: [
      { name: 'role', label: 'Job title or project name', type: 'text', placeholder: 'e.g. Web Developer Intern, College Placement Portal', required: true, maxLength: 120 },
      { name: 'level', label: 'Experience level', type: 'select', options: ['Fresher / student', 'Intern', '1–3 years', '4+ years'], maxLength: 40 },
      { name: 'duties', label: 'What did you do? (one duty per line)', type: 'textarea', rows: 7, placeholder: 'made login page\nworked on database\nhelped team fix bugs', required: true, maxLength: 3000 },
    ],
    cta: 'Generate bullet points',
    howItWorks: ['Enter your role or project and what you did, one duty per line.', 'The AI rewrites each line with a strong action verb, the tool used and the outcome.', 'Copy the bullets, or save them into a full ATS-ready resume.'],
    faqs: [
      { q: 'What is the STAR method for resume bullet points?', a: 'STAR stands for Situation, Task, Action, Result. A STAR bullet states what you did (action), how or with what, and the outcome — for example “Built a login system with JWT, cutting sign-in errors reported by testers.”' },
      { q: 'Does the generator make up numbers?', a: 'No. Fabricated metrics are a red flag in interviews. When a number would strengthen a bullet we insert a clear [metric] placeholder so you can add your real figure.' },
      { q: 'How many bullet points should each job or project have?', a: 'Three to five for recent roles, two to three for projects and older roles. Lead with your strongest, most relevant result.' },
      { q: 'Which action verbs work best on a fresher resume?', a: 'Built, designed, implemented, automated, analysed, led, optimised and deployed read well. Avoid “responsible for” and “worked on”, which hide what you personally did.' },
      { q: 'Is this free?', a: 'Yes. Previews use 0 credits and need no account. Saving to a full resume uses your normal signup credits only when you generate or AI-edit.' },
    ],
  },
  {
    slug: 'ats-keyword-generator',
    navTitle: 'ATS Keyword Extractor',
    h1: 'ATS Resume Keyword Extractor & Generator',
    metaTitle: 'Free ATS Keyword Extractor — Find Resume Keywords from a Job Description',
    metaDescription:
      'Paste a job description and instantly extract the must-have hard skills, soft skills and ATS keywords to put on your resume. Free ATS resume keyword generator.',
    keywords: ['ATS keyword generator', 'resume keyword extractor', 'ATS resume keywords', 'job description keywords', 'keywords for resume from job description'],
    intro:
      'Applicant tracking systems rank resumes by how well they match the job description. Paste any job post to see exactly which hard skills, tools, soft skills and phrases to mirror — grouped by how critical they are.',
    fields: [
      { name: 'role', label: 'Job title (optional)', type: 'text', placeholder: 'e.g. Data Analyst', maxLength: 120 },
      { name: 'jobDescription', label: 'Job description', type: 'textarea', rows: 10, placeholder: 'Paste the full job description here…', required: true, maxLength: 6000 },
    ],
    cta: 'Extract keywords',
    howItWorks: ['Paste the job description of the role you want.', 'We pull out must-have vs nice-to-have skills, tools, soft skills and exact phrases.', 'Work the keywords you genuinely have into your resume — or scan your resume against them.'],
    faqs: [
      { q: 'What are ATS keywords?', a: 'ATS keywords are the skills, tools, qualifications and phrases a recruiter’s applicant tracking system searches for. Resumes that contain the same terms as the job description rank higher.' },
      { q: 'Should I copy every keyword into my resume?', a: 'Only the ones that are true for you. Add real skills in your skills section and weave them into bullet points with context. Keyword stuffing lowers your credibility with human reviewers.' },
      { q: 'What is the difference between hard and soft skills keywords?', a: 'Hard skills are teachable and measurable — Python, SQL, Figma, AutoCAD. Soft skills describe behaviour, such as stakeholder communication or mentoring. ATS filters mostly weigh hard skills and tools.' },
      { q: 'How many keywords should I include?', a: 'Match the top 8–15 requirements that apply to you, using the same wording as the posting (for example “Machine Learning” rather than “ML” only).' },
      { q: 'Can I check my full resume against these keywords?', a: 'Yes — run the free ATS scan with the same job description to see matched and missing keywords in your actual resume.' },
    ],
  },
  {
    slug: 'resume-summary-generator',
    navTitle: 'Summary & Objective Generator',
    h1: 'Professional Resume Summary & Objective Generator',
    metaTitle: 'Free Resume Summary & Career Objective Generator for Freshers',
    metaDescription:
      'Generate a professional resume summary or career objective tailored to your target role — for freshers, internships and experienced candidates. Free AI tool.',
    keywords: ['resume summary generator', 'career objective for fresher', 'professional summary for resume', 'resume objective examples', 'internship resume objective'],
    intro:
      'A strong two-to-three line summary is the first thing recruiters read. Tell us your target role, level and a few facts about you and get three polished options plus a short career objective for entry-level applications.',
    fields: [
      { name: 'role', label: 'Target role', type: 'text', placeholder: 'e.g. Software Engineer Intern', required: true, maxLength: 120 },
      { name: 'level', label: 'Your level', type: 'select', options: ['Fresher', 'Internship seeker', 'Experienced (1–5 yrs)', 'Senior (5+ yrs)', 'Career changer'], maxLength: 40 },
      { name: 'skills', label: 'Key skills', type: 'text', placeholder: 'React, Node.js, SQL, problem solving', maxLength: 400 },
      { name: 'highlights', label: 'Education, projects or achievements', type: 'textarea', rows: 5, placeholder: 'B.Tech CSE 2026, built a placeholder-free portal used by 300 students, won college hackathon…', required: true, maxLength: 1500 },
    ],
    cta: 'Generate summary',
    howItWorks: ['Choose your role and level, then add skills and highlights.', 'Get three summary styles and a short career objective.', 'Copy your favourite, or drop it into the resume builder.'],
    faqs: [
      { q: 'Summary or objective — which should I use?', a: 'Experienced candidates use a professional summary that leads with achievements. Freshers and career changers can use a short objective that states the role they want and the value they bring.' },
      { q: 'How long should a resume summary be?', a: 'Two to three lines, roughly 40–60 words. Recruiters skim, so every word should earn its place.' },
      { q: 'Should I use “I” in my resume summary?', a: 'No. Write in implied first person, e.g. “Final-year CSE student skilled in React and Node.js…”.' },
      { q: 'Does it work for internship resumes?', a: 'Yes — pick “Internship seeker” and mention the skills and projects most relevant to the internship.' },
      { q: 'Will the AI add claims that are not true?', a: 'It only uses what you provide. Always read the result and delete anything that doesn’t match your real experience.' },
    ],
  },
  {
    slug: 'cover-letter-generator',
    navTitle: 'Cover Letter Generator',
    h1: '1-Click AI Cover Letter Generator',
    metaTitle: 'Free AI Cover Letter Generator — Match Your Resume to Any Job',
    metaDescription:
      'Paste your resume and a job description to get a tailored, cliché-free cover letter in one click. Free AI cover letter generator for freshers and job seekers.',
    keywords: ['AI cover letter generator', 'cover letter for fresher', 'cover letter generator free', 'cover letter from resume and job description', 'internship cover letter'],
    intro:
      'Paste your resume text and the job description. We match your real experience to what the employer asked for and write a concise, specific cover letter — no filler phrases, no invented achievements.',
    fields: [
      { name: 'role', label: 'Job title', type: 'text', placeholder: 'e.g. Frontend Developer', required: true, maxLength: 120 },
      { name: 'company', label: 'Company (optional)', type: 'text', placeholder: 'e.g. Acme Technologies', maxLength: 120 },
      { name: 'resume', label: 'Your resume (paste text)', type: 'textarea', rows: 8, placeholder: 'Paste your resume text here…', required: true, maxLength: 6000 },
      { name: 'jobDescription', label: 'Job description', type: 'textarea', rows: 7, placeholder: 'Paste the job description here…', required: true, maxLength: 4000 },
    ],
    cta: 'Write my cover letter',
    howItWorks: ['Paste your resume and the job description.', 'The AI picks your most relevant experience and addresses the employer’s needs.', 'Copy the letter or save it alongside your resume.'],
    faqs: [
      { q: 'How long should a cover letter be?', a: 'Three to four short paragraphs, under one page — about 250–350 words.' },
      { q: 'Do freshers need a cover letter?', a: 'It helps. With limited experience, a cover letter lets you connect projects, internships and coursework to the role.' },
      { q: 'Will it copy my resume word for word?', a: 'No. It selects the most relevant facts and explains why they matter for this job.' },
      { q: 'Is the cover letter ATS friendly?', a: 'Yes. It is plain text with standard paragraphs you can paste into an application form or a Word/PDF file.' },
      { q: 'Does it invent achievements?', a: 'No. It only uses facts in your resume and the job posting. Review it before sending.' },
    ],
  },
];

export const TOOL_BY_SLUG: Record<string, ToolConfig> = Object.fromEntries(TOOLS.map((t) => [t.slug, t]));

export function toolUrl(slug: string) {
  return `${SITE_URL}/tools/${slug}`;
}
