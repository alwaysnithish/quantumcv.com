import {
  buildEvidenceMap,
  validateAndGroundAnalysis,
  extractLosslessMetrics,
  KNOWN_TECHNICAL_TERMS,
  EvidenceMap,
  GroundedQuestion,
} from './evidence-grounding';

type Entry = { id?: string; title?: string; subtitle?: string; bullets?: string[]; date_start?: string; date_end?: string; location?: string };
type Section = {
  id?: string;
  type?: string;
  title?: string;
  summary_text?: string;
  entries?: Entry[];
  bullets?: string[];
  skill_groups?: { category?: string; skills?: string[] }[];
  skills?: { name?: string; level?: number }[];
  tags?: string[];
};
export type ResumeData = { name?: string; email?: string; phone?: string; linkedin?: string; github?: string; target_role?: string; sections?: Section[] };

export type ReviewPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ActionType = 'immediate_fix' | 'missing_information' | 'role_dependent';

export type TopImprovement = {
  rank: number;
  priority: ReviewPriority;
  title: string;
  problem_found: string;
  why_it_matters: string;
  action_type: ActionType;
  how_to_fix: string;
  location: string;
};

export type CriticalIssue = {
  type: 'terminology_mistake' | 'factual_error' | 'major_ats_problem' | 'missing_essential_info' | 'credibility_issue' | 'date_inconsistency' | 'parser_uncertainty';
  title: string;
  problem_found: string;
  why_it_matters: string;
  how_to_fix: string;
  location: string;
};

export type ContentImpactImprovement = {
  title: string;
  location: string;
  issue_identified: string;
  why_it_matters: string;
  how_to_fix: string;
  before_after_examples: Array<{
    original: string;
    improved: string;
    why_improved: string;
    metric_guidance?: string;
  }>;
};

export type ATSImprovements = {
  parseability_status: 'Good' | 'Needs Attention' | 'Critical';
  ats_score_estimate: number;
  recruiter_readability_balance: string;
  formatting_risks: string[];
  section_header_feedback: string[];
  keyword_strategy: string;
};

export type RoleSpecificImprovements = {
  target_role: string;
  job_description_provided: boolean;
  role_analysis_limited_note: string;
  strong_matches: string[];
  missing_important_keywords: Array<{ keyword: string; importance: 'High' | 'Medium'; reason: string }>;
  unproven_skills: Array<{ skill: string; note: string }>;
  experiences_to_emphasize: string[];
  unevidenced_claims_to_avoid: string[];
};

export type SectionOptimization = {
  section_name: string;
  action: 'keep' | 'remove' | 'shorten' | 'reorder' | 'strengthen';
  reason: string;
  why_it_matters: string;
  recommendation: string;
};

export type CandidateInformationNeeded = {
  item_to_provide: string;
  why_needed: string;
  suggested_prompt: string;
  target_section: string;
};

export type ReviewIssue = {
  category: 'Missing' | 'Recruiter note' | 'ATS' | 'Critical' | 'Content' | 'Section';
  title: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
};

export type DetectionState = 'DETECTED' | 'NOT_DETECTED' | 'UNCERTAIN';
export type DetectionMethod =
  | 'structured_data'
  | 'exact_heading'
  | 'regex_heading'
  | 'inline_header'
  | 'tabular_layout'
  | 'content_evidence'
  | 'none';

export type DetectedSectionInfo = {
  state: DetectionState;
  detected: boolean; // backward-compatible alias (true iff state === 'DETECTED')
  heading: string;
  matched_heading?: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  confidence_score: number; // 0.0 to 1.0 for diagnostics
  method: DetectionMethod;
  lineCount: number;
  evidence: string[];
};

export type DetectedStructure = {
  education: DetectedSectionInfo;
  experience: DetectedSectionInfo;
  projects: DetectedSectionInfo;
  skills: DetectedSectionInfo;
  leadership: DetectedSectionInfo;
  achievements: DetectedSectionInfo;
  certifications_coursework: DetectedSectionInfo;
  summary: DetectedSectionInfo;
  publications: DetectedSectionInfo;
};

export type RecruiterReview = {
  first_impression: string;
  strengths: string[];
  concerns: string[];
  interview_probability: 'Strong' | 'Moderate' | 'Needs Polish' | 'Provisional';
  likely_recruiter_questions: string[];
  grounded_questions?: GroundedQuestion[];
};

export type ResumeReview = {
  overall: number;
  ats: number;
  content: number;
  impact: number;
  structure: number;
  career_stage: 'student_fresher' | 'junior' | 'mid' | 'senior_lead';
  career_stage_context: string;
  executive_summary?: string;
  must_fix_count: number;
  nice_to_have_count: number;
  strengths: string[];
  issues: ReviewIssue[];
  missingKeywords: string[];
  actionVerbs: string[];

  // Structure detection & parser confidence layer
  analysis_confidence: 'high' | 'medium' | 'low';
  analysis_confidence_note?: string;
  detected_structure: DetectedStructure;

  // Evidence grounding layer
  evidence_map?: EvidenceMap;

  // Recruiter review card
  recruiter_review?: RecruiterReview;

  // Structured Sections A through G:
  top_5_improvements: TopImprovement[];
  critical_issues: CriticalIssue[];
  content_impact_improvements: ContentImpactImprovement[];
  ats_improvements: ATSImprovements;
  role_specific_improvements: RoleSpecificImprovements;
  section_optimization: SectionOptimization[];
  candidate_information_needed: CandidateInformationNeeded[];
};

const ACTION_VERBS = [
  'achieved', 'built', 'created', 'delivered', 'designed', 'developed', 'drove', 'improved', 'increased', 'launched', 'led', 'managed', 'optimized', 'reduced', 'shipped',
  'architected', 'automated', 'accelerated', 'scaled', 'resolved', 'implemented', 'orchestrated', 'spearheaded', 'engineered', 'streamlined', 'executed', 'formulated',
  'refactored', 'mentored', 'authored', 'established', 'benchmarked', 'deployed', 'programmed', 'constructed', 'revamped'
];

const GENERIC_PATTERNS = [
  { match: /\b(responsible for|tasked with)\b/i, label: 'Passive responsibility phrasing', verb: 'Led / Executed' },
  { match: /\b(worked on|worked with)\b/i, label: 'Vague participation phrasing', verb: 'Built / Developed' },
  { match: /\b(helped with|helped to|assisted with|assisted in)\b/i, label: 'Understated contribution', verb: 'Co-developed / Implemented' },
  { match: /\b(participated in|involved in)\b/i, label: 'Unclear role ownership', verb: 'Contributed to / Delivered' },
  { match: /\b(handled|dealt with)\b/i, label: 'Routine maintenance wording', verb: 'Managed / Optimized' },
];

const TERMINOLOGY_CHECKS: Array<{ regex: RegExp; correct: string; name: string }> = [
  { regex: /\bjavascript\b(?!\.js)/i, correct: 'JavaScript', name: 'JavaScript' },
  { regex: /\btypescript\b(?!\.js)/i, correct: 'TypeScript', name: 'TypeScript' },
  { regex: /\b(nodejs|node\.js|node js)\b/i, correct: 'Node.js', name: 'Node.js' },
  { regex: /\b(reactjs|react\.js)\b/i, correct: 'React', name: 'React' },
  { regex: /\b(nextjs|next\.js)\b/i, correct: 'Next.js', name: 'Next.js' },
  { regex: /\b(vuejs|vue\.js)\b/i, correct: 'Vue.js', name: 'Vue.js' },
  { regex: /\bgithub\b/i, correct: 'GitHub', name: 'GitHub' },
  { regex: /\bgitlab\b/i, correct: 'GitLab', name: 'GitLab' },
  { regex: /\b(postgresql|postgres)\b/i, correct: 'PostgreSQL', name: 'PostgreSQL' },
  { regex: /\bmongodb\b/i, correct: 'MongoDB', name: 'MongoDB' },
  { regex: /\bgraphql\b/i, correct: 'GraphQL', name: 'GraphQL' },
  { regex: /\b(html5|html 5)\b/i, correct: 'HTML5', name: 'HTML5' },
  { regex: /\b(css3|css 3)\b/i, correct: 'CSS3', name: 'CSS3' },
  { regex: /\bkubernetes\b/i, correct: 'Kubernetes', name: 'Kubernetes' },
  { regex: /\bdocker\b/i, correct: 'Docker', name: 'Docker' },
  { regex: /\b(rest api|rest apis|restful api|restful apis)\b/i, correct: 'RESTful APIs', name: 'RESTful APIs' },
  { regex: /\b(ci\/cd|cicd)\b/i, correct: 'CI/CD', name: 'CI/CD' },
  { regex: /\bdevops\b/i, correct: 'DevOps', name: 'DevOps' },
  { regex: /\baws\b/i, correct: 'AWS', name: 'AWS' },
  { regex: /\b(gcp|google cloud platform)\b/i, correct: 'GCP', name: 'GCP' },
  { regex: /\bazure\b/i, correct: 'Azure', name: 'Azure' },
  { regex: /\b(pytorch|py-torch)\b/i, correct: 'PyTorch', name: 'PyTorch' },
  { regex: /\btensorflow\b/i, correct: 'TensorFlow', name: 'TensorFlow' },
  { regex: /\b(scikit-learn|sklearn)\b/i, correct: 'scikit-learn', name: 'scikit-learn' },
  { regex: /\b(nosql|no-sql)\b/i, correct: 'NoSQL', name: 'NoSQL' },
  { regex: /\bredis\b/i, correct: 'Redis', name: 'Redis' },
  { regex: /\bkafka\b/i, correct: 'Apache Kafka', name: 'Apache Kafka' },
  { regex: /\brabbitmq\b/i, correct: 'RabbitMQ', name: 'RabbitMQ' },
  { regex: /\btailwindcss\b/i, correct: 'Tailwind CSS', name: 'Tailwind CSS' },
  { regex: /\blinux\b/i, correct: 'Linux', name: 'Linux' },
];

const COMMON_TYPOS: Array<{ regex: RegExp; correction: string; word: string }> = [
  { regex: /\bteh\b/i, correction: 'the', word: 'teh' },
  { regex: /\bmanger\b/i, correction: 'manager', word: 'manger' },
  { regex: /\b(expereince|experiance)\b/i, correction: 'experience', word: 'expereince' },
  { regex: /\b(develope|devloper)\b/i, correction: 'developer', word: 'devloper' },
  { regex: /\b(responsibilites|responsabilites)\b/i, correction: 'responsibilities', word: 'responsibilities' },
  { regex: /\b(programing)\b/i, correction: 'programming', word: 'programing' },
  { regex: /\b(succesful|sucessful)\b/i, correction: 'successful', word: 'succesful' },
  { regex: /\b(implimented|implimentation)\b/i, correction: 'implemented', word: 'implimented' },
  { regex: /\b(seperate|seperation)\b/i, correction: 'separate', word: 'seperate' },
  { regex: /\b(untill)\b/i, correction: 'until', word: 'untill' },
];

export { KNOWN_TECHNICAL_TERMS };

const STOP_WORDS = new Set([
  'with', 'that', 'this', 'from', 'your', 'will', 'have', 'their', 'about', 'into', 'using', 'years', 'role', 'team', 'work', 'skills', 'experience', 'requirements', 'candidate',
  'the', 'and', 'for', 'are', 'you', 'ability', 'knowledge', 'proficient', 'proficiency', 'must', 'plus', 'preferred', 'opportunity', 'responsibilities',
  'looking', 'strong', 'full', 'stack', 'seeking', 'responsible', 'join', 'company', 'working', 'help', 'ideal', 'passionate', 'drive', 'environment', 'solutions',
  'collaborate', 'deliver', 'support', 'closely', 'across', 'high', 'level', 'based', 'good', 'well', 'great', 'needs', 'build', 'create', 'including', 'such'
]);

/**
 * Normalizes extracted text internally for robust section detection.
 * Does NOT mutate the user's raw resume content.
 */
export function normalizeExtractedText(raw: string): string {
  if (!raw) return '';
  return raw
    // Invisible control / zero-width characters
    .replace(/[\u00ad\u200b\u200c\u200d\ufeff]/g, '')
    // Unicode spaces (non-breaking, em, en, thin, ideographic)
    .replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, ' ')
    // Unicode hyphens, dashes, minus signs
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\ufe58\ufe63\uff0d]/g, '-')
    // Un-space single-character spaced headers (e.g. "E D U C A T I O N" -> "EDUCATION", "W O R K   E X P E R I E N C E" -> "WORK EXPERIENCE")
    .replace(/^(?:[A-Z]\s+){2,}[A-Z](?:\s{2,}(?:[A-Z]\s+){2,}[A-Z])*$/gm, (match) => {
      return match.split(/\s{2,}/).map((word) => word.replace(/\s+/g, '')).join(' ');
    })
    .replace(/^([A-Z])(?:\s+([A-Z])){2,}$/gm, (match) => match.replace(/\s+/g, ''))
    // Standardize bullet points
    .replace(/[\u2022\u25cf\u25aa\u25b8\u2023\u2043\u2219\u25c6\u25ba\u2713\u2714\u2756\u2728\u2605\u25aa\u25fe\u25fd]/g, '•')
    // Standardize ligatures
    .replace(/ﬁ/g, 'fi')
    .replace(/ﬂ/g, 'fl')
    .replace(/ﬃ/g, 'ffi')
    .replace(/ﬄ/g, 'ffl')
    .replace(/ﬅ/g, 'ft')
    .replace(/ﬆ/g, 'st')
    // Rejoin PDF hyphenated line-wraps (e.g. "devel-\noper" -> "developer")
    .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')
    // Normalize newlines
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeText(s?: string) {
  return (s ?? '').toString().replace(/\s+/g, ' ').trim();
}

export function getResumeText(data: ResumeData | string): string {
  if (typeof data === 'string') return data;
  const parts: string[] = [];
  if (data.name) parts.push(data.name);
  if (data.target_role) parts.push(data.target_role);
  for (const sec of data.sections ?? []) {
    if (sec.title) parts.push(sec.title);
    if (sec.summary_text) parts.push(sec.summary_text);
    if (Array.isArray(sec.entries)) {
      for (const e of sec.entries) {
        if (e.title) parts.push(e.title);
        if (e.subtitle) parts.push(e.subtitle);
        if (Array.isArray(e.bullets)) parts.push(...e.bullets.filter(Boolean));
      }
    }
    if (Array.isArray(sec.skill_groups)) {
      for (const g of sec.skill_groups) if (Array.isArray(g.skills)) parts.push(...g.skills.filter(Boolean));
    }
    if (Array.isArray(sec.skills)) parts.push(...sec.skills.map((s) => s.name || '').filter(Boolean));
    if (Array.isArray(sec.tags)) parts.push(...sec.tags.filter(Boolean));
  }
  return parts.map((p) => normalizeText(p)).filter(Boolean).join('\n');
}

export function extractContactInfo(raw: string) {
  const text = raw || '';
  const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
  const phoneMatch = text.match(/\+?\d[\d ()-]{6,}\d/);
  const links = Array.from(text.matchAll(/https?:\/\/[^\s)"']+/gi)).map((m) => m[0]);
  return { email: emailMatch?.[0] ?? '', phone: phoneMatch?.[0] ?? '', links };
}

export function getFollowUpQuestions(rawData: string, role: string) {
  const input = (rawData ?? '').toLowerCase();
  const questions: string[] = [];
  if (!/\b\d+\b|%|users|revenue|hours|days|months|k\b/i.test(input)) {
    questions.push('What measurable result, scale, or outcome can you truthfully add to your strongest project or role?');
  }
  if (!/linkedin|github|portfolio|https?:\/\//i.test(input)) questions.push('Do you want to include a verified LinkedIn, GitHub, or portfolio link?');
  if (!/\b(20\d{2}|19\d{2}|\w+ \d{4})\b/.test(input)) questions.push('What are the dates (month + year) for your most relevant experience, education, or projects?');
  if (role && role.trim() && !input.includes(role.toLowerCase())) questions.push(`Which specific experience or project best proves your readiness for a ${role} position?`);
  return questions.slice(0, 3);
}

function detectCareerStage(text: string): { stage: 'student_fresher' | 'junior' | 'mid' | 'senior_lead'; context: string } {
  const lower = text.toLowerCase();
  const isStudent = /\b(student|fresher|final year|b\.tech|btech|b\.e\.|undergraduate|pursuing|expected grad|cgpa|gpa|iit|nit|iiit|bits|bachelor)\b/i.test(lower);
  const isSenior = /\b(senior|lead|principal|staff|director|head of|architect|manager|10\+|8\+|12\+|15\+)\b/i.test(lower);
  
  const expMatch = lower.match(/(\d+)\s*\+?\s*years?\s+(?:of\s+)?experience/);
  const years = expMatch ? parseInt(expMatch[1], 10) : 0;

  if (isSenior || years >= 8) {
    return {
      stage: 'senior_lead',
      context: 'Evaluated as a Senior/Lead candidate: emphasis placed on architecture, team leadership, strategic impact, and business outcomes over coursework.',
    };
  }
  if (years >= 4) {
    return {
      stage: 'mid',
      context: 'Evaluated as a Mid-level professional: emphasis placed on technical ownership, collaboration, and measurable project impact.',
    };
  }
  if (isStudent || years <= 1) {
    return {
      stage: 'student_fresher',
      context: 'Evaluated as an Early-Career / Student candidate: evaluated based on coursework, technical projects, core fundamentals, and internship potential rather than extensive work history.',
    };
  }
  return {
    stage: 'junior',
    context: 'Evaluated as a Junior professional: emphasis placed on practical application of skills, development workflows, and growth trajectory.',
  };
}

export const SECTION_PATTERNS: Record<keyof DetectedStructure, RegExp[]> = {
  education: [
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?education(?:al)?\s*(?:details?|qualifications?|background|history|record|profile|credentials?)?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?academic\s*(?:qualifications?|background|details?|record|history|profile|credentials?)?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?academics\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?education\s*(?:&|and|\+)\s*(?:qualifications?|academics?|training)\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?degrees?\s*(?:&|and|\+)?\s*(?:qualifications?)?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?qualifications?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?studies\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?formal\s+education\b/i,
    /^(?:e\s*d\s*u\s*c\s*a\s*t\s*i\s*o\s*n|a\s*c\s*a\s*d\s*e\s*m\s*i\s*c\s*s)\b/i,
  ],
  experience: [
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?(?:work|professional|industry|relevant|employment|career|technical|corporate|internship|practical|industrial|field|selected|previous)\s+experience\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?experience\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?(?:work|employment|career|professional)\s+(?:history|background|summary|record|profile|timeline)\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?internships?(?:\s*(?:&|and|\+|\/)\s*(?:training|experience|projects?))?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?practical\s+experience\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?employment\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?work\s+history\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?work\s+exp(?:erience)?\.?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?(?:work|professional)\s*(?:&|and|\+|\/)\s*(?:experience|internships?|projects?)\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?professional\s+background\b/i,
    /^(?:e\s*x\s*p\s*e\s*r\s*i\s*e\s*n\s*c\s*e|w\s*o\s*r\s*k\s*e\s*x\s*p\s*e\s*r\s*i\s*e\s*n\s*c\s*e)\b/i,
  ],
  projects: [
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?(?:academic|personal|technical|key|notable|selected|major|course|software|hardware|capstone|development|engineering|hands-on|side|relevant)\s+projects?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?projects?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?projects?\s*(?:&|and|\+)\s*(?:works?|portfolio|initiatives?|applications?|systems?)\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?project\s+work\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?development\s+projects?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?portfolio\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?software\s+projects?\b/i,
    /^(?:p\s*r\s*o\s*j\s*e\s*c\s*t\s*s)\b/i,
  ],
  skills: [
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?(?:technical|core|key|professional|programming|software|it|engineering|developer)\s+skills?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?technical\s+(?:proficiencies|proficiency|expertise|stack|competencies|abilities|summary|domain)\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?skills?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?skills?\s*(?:&|and|\+|\/)\s*(?:technologies|tools|abilities|frameworks|expertise|competencies)\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?(?:tools?\s*(?:&|and|\+|\/)\s*technologies?|technologies?\s*(?:&|and|\+|\/)\s*tools?)\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?technologies?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?tech\s+stack\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?areas?\s+of\s+expertise\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?programming\s+languages?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?core\s+competencies\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?skills\s+inventory\b/i,
    /^(?:s\s*k\s*i\s*l\s*l\s*s|t\s*e\s*c\s*h\s*n\s*i\s*c\s*a\s*l\s*s\s*k\s*i\s*l\s*l\s*s)\b/i,
  ],
  leadership: [
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?positions?\s+of\s+responsibility\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?roles?\s+of\s+responsibility\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?(?:leadership|organizational|volunteer|community|student)\s+(?:experience|activities|involvement|roles?|initiatives?|service)\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?leadership\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?responsibilities\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?co-curricular\s+(?:activities|involvement)\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?extra-?curricular\s+(?:involvement|activities)\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?volunteering\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?community\s+service\b/i,
  ],
  achievements: [
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?(?:scholastic|academic|key|major|notable|competitive)?\s*achievements?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?honors?\s*(?:&|and|\+|\/)\s*awards?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?honours?\s*(?:&|and|\+|\/)\s*awards?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?awards?\s*(?:&|and|\+|\/)\s*(?:honors?|honours?|recognition|accolades?|achievements?)\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?awards?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?accolades?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?competitions?\s*(?:&|and|\+|\/)\s*(?:contests?|hackathons?)\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?accomplishments?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?distinctions?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?scholarships?\s*(?:&|and|\+)?\s*(?:awards?)?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?achievements?\s*(?:&|and|\+|\/)\s*awards?\b/i,
    /^(?:a\s*c\s*h\s*i\s*e\s*v\s*e\s*m\s*e\s*n\s*t\s*s)\b/i,
  ],
  certifications_coursework: [
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?(?:licenses?\s*(?:&|and|\+|\/)\s*)?certifications?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?certificates?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?(?:relevant\s+|key\s+)?coursework\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?courses?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?moocs?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?trainings?\s*(?:&|and|\+|\/)\s*workshops?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?professional\s+development\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?credentials?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?certifications?\s*(?:&|and|\+|\/)\s*licenses?\b/i,
  ],
  summary: [
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?(?:professional|executive|career|personal)\s+(?:summary|profile|statement|objective|overview)\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?summary\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?profile\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?objective\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?about\s+me\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?bio\b/i,
  ],
  publications: [
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?publications?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?research\s+(?:papers?|publications?|work)\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?patents?\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?conference\s+proceedings\b/i,
    /^(?:#+\s*|\*+\s*|[-–—]+\s*)?journal\s+articles?\b/i,
  ],
};

function createEmptyDetectedSection(): DetectedSectionInfo {
  return {
    state: 'NOT_DETECTED',
    detected: false,
    heading: '',
    confidence: 'none',
    confidence_score: 0.0,
    method: 'none',
    lineCount: 0,
    evidence: [],
  };
}

/**
 * Robust multi-pass section detector:
 * 1. Evaluates structured resume data (if available)
 * 2. Scans line headings with normalization and variation matching
 * 3. Validates content-based fallbacks (work experience, degrees, tech stacks, projects, achievements, leadership)
 * 4. Produces state (DETECTED, NOT_DETECTED, UNCERTAIN) and diagnostics
 */
export function parseResumeStructure(rawText: string, structuredSections?: Section[]): DetectedStructure {
  const norm = normalizeExtractedText(rawText);
  const lines = norm.split('\n');

  const structure: DetectedStructure = {
    education: createEmptyDetectedSection(),
    experience: createEmptyDetectedSection(),
    projects: createEmptyDetectedSection(),
    skills: createEmptyDetectedSection(),
    leadership: createEmptyDetectedSection(),
    achievements: createEmptyDetectedSection(),
    certifications_coursework: createEmptyDetectedSection(),
    summary: createEmptyDetectedSection(),
    publications: createEmptyDetectedSection(),
  };

  // Pass 1: If structured sections object is provided, populate from sections array
  if (Array.isArray(structuredSections) && structuredSections.length > 0) {
    for (const sec of structuredSections) {
      const title = (sec.title || '').trim();
      const type = (sec.type || '').trim().toLowerCase();

      for (const [key, patterns] of Object.entries(SECTION_PATTERNS) as [keyof DetectedStructure, RegExp[]][]) {
        if (patterns.some((p) => p.test(title) || p.test(type)) || type.includes(key)) {
          structure[key].state = 'DETECTED';
          structure[key].detected = true;
          structure[key].heading = title || key;
          structure[key].matched_heading = title || key;
          structure[key].confidence = 'high';
          structure[key].confidence_score = 1.0;
          structure[key].method = 'structured_data';
          structure[key].lineCount += (sec.entries?.length || 0) + (sec.bullets?.length || 0) + (sec.tags?.length || 0);
          if (title) structure[key].evidence.push(`Structured section titled "${title}"`);
        }
      }
    }
  }

  // Pass 2: Line-by-line heading scanning
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    // Clean headers of leading/trailing symbols, markdown hashes, section numbers, bullets, dashes, colons
    const cleanHeader = rawLine
      .replace(/^[#*_\-–—•▪►◆■●★✓\[\]|~]+\s*/, '')
      .replace(/^(?:section\s+)?(?:\d+|[a-zA-Z]|[ivxlcdm]+)[\.\:\)\-\]]\s+/i, '')
      .replace(/[:\-–—#*_\[\]|~]+$/, '')
      .trim();

    if (!cleanHeader || cleanHeader.length > 75) continue;

    for (const [key, patterns] of Object.entries(SECTION_PATTERNS) as [keyof DetectedStructure, RegExp[]][]) {
      if (structure[key].state === 'DETECTED' && structure[key].confidence === 'high') continue;

      const upper = cleanHeader.toUpperCase();
      const isExact = upper === key.toUpperCase() ||
        (key === 'skills' && (upper === 'TECHNICAL SKILLS' || upper === 'SKILLS' || upper === 'CORE SKILLS' || upper === 'TECH STACK' || upper === 'SKILLS & TOOLS' || upper === 'SKILLS AND TOOLS')) ||
        (key === 'education' && (upper === 'EDUCATION' || upper === 'ACADEMICS' || upper === 'ACADEMIC QUALIFICATIONS' || upper === 'EDUCATIONAL QUALIFICATIONS' || upper === 'ACADEMIC BACKGROUND')) ||
        (key === 'experience' && (upper === 'EXPERIENCE' || upper === 'WORK EXPERIENCE' || upper === 'PROFESSIONAL EXPERIENCE' || upper === 'EMPLOYMENT' || upper === 'WORK HISTORY' || upper === 'INTERNSHIP EXPERIENCE' || upper === 'INTERNSHIPS' || upper === 'EMPLOYMENT HISTORY' || upper === 'CAREER HISTORY' || upper === 'PROFESSIONAL BACKGROUND')) ||
        (key === 'projects' && (upper === 'PROJECTS' || upper === 'TECHNICAL PROJECTS' || upper === 'ACADEMIC PROJECTS' || upper === 'KEY PROJECTS' || upper === 'PERSONAL PROJECTS' || upper === 'DEVELOPMENT PROJECTS')) ||
        (key === 'leadership' && (upper === 'POSITIONS OF RESPONSIBILITY' || upper === 'LEADERSHIP' || upper === 'RESPONSIBILITIES' || upper === 'CO-CURRICULAR ACTIVITIES' || upper === 'EXTRA-CURRICULAR ACTIVITIES')) ||
        (key === 'achievements' && (upper === 'ACHIEVEMENTS' || upper === 'AWARDS' || upper === 'HONORS & AWARDS' || upper === 'HONOURS & AWARDS' || upper === 'ACCOMPLISHMENTS' || upper === 'SCHOLASTIC ACHIEVEMENTS')) ||
        (key === 'certifications_coursework' && (upper === 'CERTIFICATIONS' || upper === 'CERTIFICATES' || upper === 'COURSEWORK' || upper === 'RELEVANT COURSEWORK' || upper === 'LICENSES & CERTIFICATIONS')) ||
        (key === 'summary' && (upper === 'SUMMARY' || upper === 'PROFESSIONAL SUMMARY' || upper === 'EXECUTIVE SUMMARY' || upper === 'PROFILE' || upper === 'CAREER OBJECTIVE' || upper === 'OBJECTIVE'));

      const isMatch = isExact || patterns.some((p) => p.test(cleanHeader) || p.test(rawLine.trim()));

      if (isMatch) {
        structure[key].state = 'DETECTED';
        structure[key].detected = true;
        structure[key].heading = cleanHeader || key;
        structure[key].matched_heading = cleanHeader || key;
        structure[key].confidence = 'high';
        structure[key].confidence_score = isExact ? 0.98 : 0.95;
        structure[key].method = isExact ? 'exact_heading' : 'regex_heading';
        structure[key].evidence.push(`Header found at line ${i + 1}: "${cleanHeader || rawLine.trim()}"`);
      }
    }
  }

  // Pass 3: Content-based evidence validation
  const lower = norm.toLowerCase();

  // Experience Content Validation
  if (structure.experience.state !== 'DETECTED') {
    const jobTitleRegex = /\b(software engineer|frontend developer|backend developer|full stack developer|web developer|mobile developer|ios developer|android developer|sde|swe|mts|data scientist|machine learning engineer|ai engineer|devops engineer|cloud architect|systems engineer|qa engineer|test engineer|intern|internship|research assistant|teaching assistant|project intern|engineering intern|software engineering intern|sde intern|swe intern|technical lead|team lead|lead developer|associate|consultant|analyst|product manager|member of technical staff)\b/i;
    const dateRangeRegex = /\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—to\s]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}|present|current|till date)\b/i;
    const employmentIndicators = /\b(employed at|worked at|worked as|intern at|internship at|at [A-Z][a-zA-Z0-9\s&.,]{2,25}(?:pvt|ltd|inc|llc|corp|technologies|solutions|labs|systems)?)\b/i;

    const linesWithTitlesAndDates = lines.filter((l) => jobTitleRegex.test(l) && (dateRangeRegex.test(l) || employmentIndicators.test(l)));
    const hasJobTitle = jobTitleRegex.test(norm);
    const hasDateRange = dateRangeRegex.test(norm);

    if (linesWithTitlesAndDates.length >= 1 || (hasJobTitle && hasDateRange)) {
      structure.experience.state = 'DETECTED';
      structure.experience.detected = true;
      structure.experience.heading = 'Work Experience (Content)';
      structure.experience.matched_heading = 'WORK EXPERIENCE';
      structure.experience.confidence = 'high';
      structure.experience.confidence_score = 0.92;
      structure.experience.method = 'content_evidence';
      structure.experience.evidence.push('Detected professional title, employer/organization, and employment date duration');
    } else if (hasJobTitle) {
      structure.experience.state = 'UNCERTAIN';
      structure.experience.detected = false;
      structure.experience.confidence = 'low';
      structure.experience.confidence_score = 0.45;
      structure.experience.method = 'content_evidence';
      structure.experience.evidence.push('Found isolated professional role or title reference without clear employment duration');
    }
  }

  // Skills Content Validation
  if (structure.skills.state !== 'DETECTED') {
    const hasInlineSkillHeaders = /\b(languages|programming languages|frameworks|libraries|developer tools|databases|technologies|tools|platforms|operating systems|web technologies|core competencies)\s*[:|-]/i.test(norm);
    const techTermMatches = KNOWN_TECHNICAL_TERMS.filter((term) => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(?:^|[^a-zA-Z0-9+#])${escaped}(?:$|[^a-zA-Z0-9+#])`, 'i').test(norm);
    });

    if (hasInlineSkillHeaders) {
      structure.skills.state = 'DETECTED';
      structure.skills.detected = true;
      structure.skills.heading = 'Technical Skills (Inline)';
      structure.skills.matched_heading = 'TECHNICAL SKILLS';
      structure.skills.confidence = 'high';
      structure.skills.confidence_score = 0.94;
      structure.skills.method = 'inline_header';
      structure.skills.evidence.push(`Detected inline skill category headers (${techTermMatches.slice(0, 6).join(', ')})`);
    } else if (techTermMatches.length >= 3) {
      structure.skills.state = 'DETECTED';
      structure.skills.detected = true;
      structure.skills.heading = 'Technical Skills (Content)';
      structure.skills.matched_heading = 'TECHNICAL SKILLS';
      structure.skills.confidence = 'high';
      structure.skills.confidence_score = 0.90;
      structure.skills.method = 'content_evidence';
      structure.skills.evidence.push(`Detected technical skills inventory (${techTermMatches.slice(0, 6).join(', ')})`);
    } else if (techTermMatches.length > 0) {
      structure.skills.state = 'UNCERTAIN';
      structure.skills.detected = false;
      structure.skills.confidence = 'low';
      structure.skills.confidence_score = 0.40;
      structure.skills.method = 'content_evidence';
      structure.skills.evidence.push(`Found isolated technical keywords (${techTermMatches.join(', ')})`);
    }
  }

  // Education Content Validation
  if (structure.education.state !== 'DETECTED') {
    const hasDegreeTerm = /\b(b\.?\s*tech|btech|b\.?\s*e\.?|be\b|bachelor|b\.?\s*s\.?|b\.?\s*sc\.?|bsc\b|bs\b|m\.?\s*tech|mtech|m\.?\s*e\.?|me\b|m\.?\s*s\.?|m\.?\s*sc\.?|msc\b|ms\b|master|mba|mca|bca|ph\.?d|doctorate|diploma|higher secondary|senior secondary|class\s*(xii|x|12th|10th)|12th\s+grade|10th\s+grade|cbse|icse|state\s+board|intermediate|high\s+school|associate\s+degree)\b/i.test(lower);
    const hasInstitution = /\b(institute\s+of\s+technology|university|college|school|academy|vidyalaya|campus|polytechnic|iit\b|nit\b|iiit\b|bits\b|vtu\b|dtu\b|mit\b|cmu\b|stanford\b|harvard\b|berkeley\b|oxford\b|cambridge\b|department\s+of|faculty\s+of)\b/i.test(lower);
    const hasAcademicMetrics = /\b(cpi|cgpa|gpa|\b\d{1,2}(?:\.\d{1,2})?\s*\/\s*(?:10|4|10\.0|4\.0)|percentage|\b\d{2}(?:\.\d{1,2})?\s*%|first\s+class|distinction|specialization|expected\s+grad(?:uation)?|class\s+of\s+20\d{2}|20\d{2}\s*[-–—]\s*20\d{2}|\b(19|20)\d{2}\b)\b/i.test(lower);
    const hasTabularPipe = /\b(degree|institute|board|college|school)\s*\|\s*(institute|board|degree|year|cpi|cgpa|percentage|score|marks|duration)/i.test(lower);

    if (hasTabularPipe) {
      structure.education.state = 'DETECTED';
      structure.education.detected = true;
      structure.education.heading = 'Education (Tabular)';
      structure.education.matched_heading = 'EDUCATION';
      structure.education.confidence = 'high';
      structure.education.confidence_score = 0.96;
      structure.education.method = 'tabular_layout';
      structure.education.evidence.push('Detected tabular academic credentials layout');
    } else if (hasDegreeTerm && (hasInstitution || hasAcademicMetrics)) {
      structure.education.state = 'DETECTED';
      structure.education.detected = true;
      structure.education.heading = 'Education (Content)';
      structure.education.matched_heading = 'EDUCATION';
      structure.education.confidence = hasInstitution ? 'high' : 'medium';
      structure.education.confidence_score = hasInstitution ? 0.92 : 0.85;
      structure.education.method = 'content_evidence';
      structure.education.evidence.push('Detected academic credentials, degree, and institution/metric details');
    } else if (hasDegreeTerm || hasInstitution) {
      structure.education.state = 'UNCERTAIN';
      structure.education.detected = false;
      structure.education.confidence = 'low';
      structure.education.confidence_score = 0.45;
      structure.education.method = 'content_evidence';
      structure.education.evidence.push('Found partial educational entity reference');
    }
  }

  // Projects Content Validation
  if (structure.projects.state !== 'DETECTED') {
    const hasProjectIndicators = /\b(github\.com\/|built\s+an?|architected\s+an?|designed\s+an?|developed\s+an?|implemented\s+an?|deployed\s+on|created\s+an?|engineered\s+an?)\b/i.test(lower);
    const hasRepoOrApp = /\b(repo|repository|app|web application|cli|bot|model|pipeline|frontend|backend|platform|tool|service)\b/i.test(lower);
    if (hasProjectIndicators && hasRepoOrApp) {
      structure.projects.state = 'DETECTED';
      structure.projects.detected = true;
      structure.projects.heading = 'Projects (Content)';
      structure.projects.matched_heading = 'PROJECTS';
      structure.projects.confidence = 'medium';
      structure.projects.confidence_score = 0.86;
      structure.projects.method = 'content_evidence';
      structure.projects.evidence.push('Detected technical project deliverables and implementation bullets');
    }
  }

  // Achievements Content Validation
  if (structure.achievements.state !== 'DETECTED') {
    const hasAchievementTerms = /\b(air\s*[-:]?\s*\d+|all\s+india\s+rank\s*[-:]?\s*\d+|rank\s*#?\d+|jee\s+advanced|jee\s+main|hackathon\s+winner|1st\s+place|2nd\s+place|finalist|scholarship|leetcode\s*rating|codeforces|top\s*\d+(?:\.\d+)?%|olympiad|dean's\s+list)\b/i.test(lower);
    if (hasAchievementTerms) {
      structure.achievements.state = 'DETECTED';
      structure.achievements.detected = true;
      structure.achievements.heading = 'Achievements (Content)';
      structure.achievements.matched_heading = 'ACHIEVEMENTS';
      structure.achievements.confidence = 'high';
      structure.achievements.confidence_score = 0.93;
      structure.achievements.method = 'content_evidence';
      structure.achievements.evidence.push('Detected competitive ranks, contest achievements, or honors');
    }
  }

  // Leadership Content Validation
  if (structure.leadership.state !== 'DETECTED') {
    const hasLeadershipTerms = /\b(coordinator|lead|president|secretary|vice\s+president|head\s+of|convenor|mentor|core\s+team\s+member|organized|led\s+a\s+team)\b/i.test(lower) && /\b(club|chapter|society|fest|council|initiative|event|community)\b/i.test(lower);
    if (hasLeadershipTerms) {
      structure.leadership.state = 'DETECTED';
      structure.leadership.detected = true;
      structure.leadership.heading = 'Positions of Responsibility (Content)';
      structure.leadership.matched_heading = 'POSITIONS OF RESPONSIBILITY';
      structure.leadership.confidence = 'high';
      structure.leadership.confidence_score = 0.91;
      structure.leadership.method = 'content_evidence';
      structure.leadership.evidence.push('Detected leadership, student club, or organizational responsibilities');
    }
  }

  return structure;
}

/**
 * Robust, non-corrupting metric extractor supporting Indian & international currencies,
 * percentages, rankings, multipliers, counts with plus signs, and decimals.
 * Never truncates or leaves dangling partial values (e.g. "Rs.3,00," is prevented).
 */
export function detectResumeMetrics(text: string): { hasMetrics: boolean; metricList: string[]; metricCount: number } {
  if (!text) return { hasMetrics: false, metricList: [], metricCount: 0 };
  const extracted = extractLosslessMetrics(text);
  const validMetrics = extracted.filter((m) => m.is_valid).map((m) => m.normalized_value);

  return {
    hasMetrics: validMetrics.length > 0,
    metricList: validMetrics.slice(0, 15),
    metricCount: validMetrics.length,
  };
}

function keywordsFromJob(jobDescription: string): string[] {
  if (!jobDescription) return [];
  const cleaned = jobDescription.toLowerCase().replace(/[\(\)\[\],:;|\/]/g, ' ');
  const tokens = cleaned.match(/[a-z0-9+#.+-]{2,}/gi) ?? [];
  const filtered = tokens
    .map((t) => t.toLowerCase().replace(/^[^\w+#]+|[^\w+#]+$/g, ''))
    .filter((t) => t && !STOP_WORDS.has(t) && t.length > 2 && !/^\d+$/.test(t));
  return Array.from(new Set(filtered)).slice(0, 40);
}

/**
 * Self-Consistency Checker & Policy Validator:
 * Validates every blocker and recommendation against actual parsed resume evidence.
 *
 * CRITICAL RULES:
 * 1. ONLY NOT_DETECTED may produce a "missing section" recommendation.
 *    DETECTED -> never report missing.
 *    UNCERTAIN -> never report missing.
 * 2. If parser confidence is LOW, do not generate critical missing-section recommendations.
 * 3. Parser uncertainty is NEVER a candidate deficiency or a Critical issue.
 * 4. Never treat absence of a Job Description as a resume defect or top improvement.
 * 5. Deduplicate semantically overlapping recommendations.
 */
export function runConsistencyCheck(review: ResumeReview, structure: DetectedStructure, hasLegitimateMetrics: boolean): ResumeReview {
  const isLowConfidence = review.analysis_confidence === 'low';

  // 1. Education Consistency: If DETECTED or UNCERTAIN, or if confidence is low, strip false missing education issues
  if (structure.education.state !== 'NOT_DETECTED' || isLowConfidence) {
    review.critical_issues = review.critical_issues.filter(
      (c) => !/education/i.test(c.title) ||
             (!/missing|not detected|credentials/i.test(c.problem_found) && !/missing|add|not detected/i.test(c.title))
    );
    review.top_5_improvements = review.top_5_improvements.filter(
      (t) => !/education/i.test(t.title) ||
             (!/missing|not detected/i.test(t.problem_found) && !/missing|details missing|add.*education/i.test(t.title))
    );
    review.issues = review.issues.filter(
      (i) => !/education\s+(details|section)\s+(missing|not found)/i.test(i.title)
    );
  }

  // 2. Skills Consistency: If DETECTED or UNCERTAIN, or if confidence is low, strip false missing skills issues
  if (structure.skills.state !== 'NOT_DETECTED' || isLowConfidence) {
    review.critical_issues = review.critical_issues.filter(
      (c) => !/skills/i.test(c.title) ||
             (!/missing|not detected|no dedicated/i.test(c.problem_found) && !/missing|not detected/i.test(c.title))
    );
    review.top_5_improvements = review.top_5_improvements.filter(
      (t) => !/skills/i.test(t.title) ||
             (!/missing|not detected|no dedicated/i.test(t.problem_found) && !/missing|add.*header|not detected/i.test(t.title))
    );
    review.issues = review.issues.filter(
      (i) => !/skills\s+section\s+not\s+found/i.test(i.title)
    );
    if (structure.skills.state === 'DETECTED') {
      review.ats_improvements.section_header_feedback = ['Skills section header is standard and parseable.'];
    }
  }

  // 3. Experience / Projects Consistency: If DETECTED or UNCERTAIN, or if confidence is low, strip false missing experience issues
  if (structure.experience.state !== 'NOT_DETECTED' || structure.projects.state !== 'NOT_DETECTED' || isLowConfidence) {
    review.critical_issues = review.critical_issues.filter(
      (c) => !/experience\s+(section|details)\s+missing/i.test(c.title) &&
             !/no\s+dedicated\s+(work\s+)?experience/i.test(c.problem_found)
    );
    review.top_5_improvements = review.top_5_improvements.filter(
      (t) => !/experience/i.test(t.title) || !/missing|not detected/i.test(t.problem_found)
    );
  }

  // 4. Parser uncertainty is NEVER a candidate deficiency or a Critical issue
  review.critical_issues = review.critical_issues.filter(
    (c) => c.type !== 'parser_uncertainty' && !/parser\s+uncertainty|extraction\s+artifacts/i.test(c.title)
  );

  // 5. Metric Consistency: If legitimate metrics exist, remove generic global metric complaints
  if (hasLegitimateMetrics) {
    review.critical_issues = review.critical_issues.filter(
      (c) => !/lacks\s+quantification|missing\s+metrics/i.test(c.title)
    );
    review.issues = review.issues.filter(
      (i) => !/impact\s+lacks\s+quantification/i.test(i.title)
    );
    review.top_5_improvements = review.top_5_improvements.filter(
      (t) => !/add\s+verifiable\s+evidence\s+and\s+metrics/i.test(t.title) &&
             !/bullets\s+currently\s+lack\s+measurable\s+scale/i.test(t.problem_found) &&
             !/entire\s+resume\s+lacks\s+metrics/i.test(t.problem_found)
    );
    // Remove global "Evidence & Measurable Results" block if bullets already have metrics
    review.content_impact_improvements = review.content_impact_improvements.filter(
      (ci) => ci.title !== 'Evidence & Measurable Results' || (ci.before_after_examples && ci.before_after_examples.length > 0)
    );
  }

  // 6. Strip any JD-absence recommendations from Top Improvements (Requirement 2 & 6)
  review.top_5_improvements = review.top_5_improvements.filter(
    (t) => !/job\s*description|target\s*role|tailored\s*matching/i.test(t.title) &&
           !/no\s+target\s+role\s+or\s+job\s+description\s+was\s+supplied/i.test(t.problem_found)
  );

  // 7. Merge & Deduplicate Top Improvements (Requirement 10 & 13)
  const seenKeys = new Set<string>();
  const dedupedTop: TopImprovement[] = [];
  for (const item of review.top_5_improvements) {
    let topicKey = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (/metric|quantif|evidence/i.test(item.title)) topicKey = 'topic_metrics';
    if (/passive|generic.*opening/i.test(item.title)) topicKey = 'topic_passive_verbs';
    if (/terminology|casing|spelling/i.test(item.title)) topicKey = 'topic_terminology';
    if (/typo/i.test(item.title)) topicKey = `topic_typo_${item.title.toLowerCase()}`;
    if (/date/i.test(item.title)) topicKey = 'topic_date_order';

    if (!seenKeys.has(topicKey)) {
      seenKeys.add(topicKey);
      dedupedTop.push(item);
    }
  }
  review.top_5_improvements = dedupedTop.slice(0, 5).map((item, idx) => ({ ...item, rank: idx + 1 }));

  // 8. Protect scores against parser uncertainty (Requirement 8 & 9)
  if (isLowConfidence) {
    review.structure = Math.max(80, review.structure);
    review.ats = Math.max(78, review.ats);
    review.content = Math.max(75, review.content);
    review.impact = Math.max(70, review.impact);
    review.overall = Math.round(review.ats * 0.35 + review.content * 0.35 + review.impact * 0.2 + review.structure * 0.1);
  }

  // 9. Recalculate must_fix_count and nice_to_have_count accurately
  const niceToHaves = review.top_5_improvements.filter((i) => i.priority !== 'Critical').length + review.section_optimization.length;
  review.must_fix_count = review.critical_issues.length;
  review.nice_to_have_count = Math.max(1, niceToHaves);

  // 10. Ensure recruiter review concerns are clean and never empty
  if (review.recruiter_review) {
    const validConcerns = review.recruiter_review.concerns.filter((c) => c && c.trim() && c.trim() !== '-');
    review.recruiter_review.concerns = validConcerns.length > 0 ? validConcerns : ['No major recruiter-facing issues identified.'];
  }

  return review;
}

export function reviewResume(data: ResumeData | string, role = '', jobDescription = ''): ResumeReview {
  const text = getResumeText(data);
  const norm = normalizeExtractedText(text);
  const lower = norm.toLowerCase();
  const rawSections = typeof data === 'string' ? [] : data.sections ?? [];

  // Step 1: Multi-Pass Intelligent Structure Detection
  const structure = parseResumeStructure(norm, rawSections);

  // Step 2: Build Strict Evidence Map & Lossless Metrics
  const evidenceMap = buildEvidenceMap(norm, typeof data === 'object' ? data : undefined, structure);
  const { hasMetrics, metricList } = detectResumeMetrics(norm);

  // Step 3: Extract all bullets with location
  const bullets: { bullet: string; sectionTitle: string; entryTitle?: string }[] = [];
  if (typeof data === 'object' && Array.isArray(data.sections) && data.sections.length > 0) {
    for (const sec of data.sections) {
      const secTitle = sec.title || 'Section';
      for (const en of sec.entries ?? []) {
        for (const b of en.bullets ?? []) {
          if (b && b.trim()) bullets.push({ bullet: b.trim(), sectionTitle: secTitle, entryTitle: en.title });
        }
      }
      if (Array.isArray(sec.bullets)) {
        for (const b of sec.bullets) {
          if (b && b.trim()) bullets.push({ bullet: b.trim(), sectionTitle: secTitle });
        }
      }
    }
  } else {
    const rawLines = norm.split('\n');
    let currentSection = 'Experience / Projects';
    for (const line of rawLines) {
      const trimmed = line.trim();
      if (/^EDUCATION\b/i.test(trimmed)) currentSection = 'Education';
      else if (/^TECHNICAL SKILLS\b|^SKILLS\b/i.test(trimmed)) currentSection = 'Technical Skills';
      else if (/^PROJECTS\b/i.test(trimmed)) currentSection = 'Projects';
      else if (/^EXPERIENCE\b|^WORK EXPERIENCE\b|^PROFESSIONAL EXPERIENCE\b/i.test(trimmed)) currentSection = 'Experience';
      else if (/^ACHIEVEMENTS\b|^AWARDS\b/i.test(trimmed)) currentSection = 'Achievements';
      else if (/^POSITIONS OF RESPONSIBILITY\b|^LEADERSHIP\b/i.test(trimmed)) currentSection = 'Leadership';

      if (/^[-*•▪►◆■●★✓]\s*/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
        const cleanedBullet = trimmed.replace(/^[-*•▪►◆■●★✓]\s*|^\d+\.\s+/, '').trim();
        if (cleanedBullet.length > 12) {
          bullets.push({ bullet: cleanedBullet, sectionTitle: currentSection });
        }
      }
    }
  }

  const { stage: careerStage, context: careerStageContext } = detectCareerStage(norm);
  const hasJD = Boolean(jobDescription && jobDescription.trim());
  const hasRole = Boolean(role && role.trim());

  const top5: TopImprovement[] = [];
  const criticalIssues: CriticalIssue[] = [];
  const contentImpact: ContentImpactImprovement[] = [];
  const sectionOptimizations: SectionOptimization[] = [];
  const candidateInfoNeeded: CandidateInformationNeeded[] = [];
  const strengths: string[] = [];
  const legacyIssues: ReviewIssue[] = [];

  // Evaluate parser confidence
  const detectedCount = Object.values(structure).filter((s) => s.state === 'DETECTED').length;
  const isMinimalText = norm.length < 80;
  const analysisConfidence: 'high' | 'medium' | 'low' = isMinimalText ? 'low' : detectedCount >= 3 ? 'high' : detectedCount >= 2 ? 'medium' : 'low';
  const analysisConfidenceNote = analysisConfidence === 'low'
    ? 'Analysis confidence: Low — PDF extraction or layout artifacts may have affected automated section detection. Your resume scores are protected from internal parser uncertainty.'
    : undefined;

  // 1. Terminology & Typos Check
  const foundTechMistakes: Array<{ found: string; correct: string }> = [];
  for (const check of TERMINOLOGY_CHECKS) {
    const match = norm.match(check.regex);
    if (match && match[0] !== check.correct && !norm.includes(check.correct)) {
      foundTechMistakes.push({ found: match[0], correct: check.correct });
    }
  }

  if (foundTechMistakes.length > 0) {
    const mistakeList = foundTechMistakes.slice(0, 4).map((m) => `"${m.found}" → "${m.correct}"`).join(', ');
    criticalIssues.push({
      type: 'terminology_mistake',
      title: 'Technical Terminology Casing & Spelling',
      problem_found: `Found technical term${foundTechMistakes.length > 1 ? 's' : ''} with non-standard casing: ${mistakeList}.`,
      why_it_matters: 'Recruiters and engineering hiring managers notice imprecise terminology casing immediately, which can diminish technical credibility.',
      how_to_fix: `Update the exact casing in your skills and experience: ${foundTechMistakes.map((m) => `${m.found} to ${m.correct}`).join(', ')}.`,
      location: 'Skills / Experience',
    });
    legacyIssues.push({
      category: 'Critical',
      title: 'Imprecise technical terminology casing',
      detail: `Standardize technical terms: ${mistakeList}.`,
      severity: 'high',
    });
  }

  // Common Typos Check
  for (const typo of COMMON_TYPOS) {
    if (typo.regex.test(norm)) {
      criticalIssues.push({
        type: 'factual_error',
        title: `Typo Detected: "${typo.word}"`,
        problem_found: `Found typo "${typo.word}" in resume text.`,
        why_it_matters: 'Typos in a professional resume signal lack of attention to detail and can cause automated screening filters to fail.',
        how_to_fix: `Correct "${typo.word}" to "${typo.correction}".`,
        location: 'Resume Body',
      });
      legacyIssues.push({
        category: 'Critical',
        title: `Typo: "${typo.word}"`,
        detail: `Fix spelling of "${typo.word}" to "${typo.correction}".`,
        severity: 'high',
      });
    }
  }

  // Date Inconsistencies Check
  const dateRanges = norm.match(/\b(20\d{2}|19\d{2})\s*[-–—]\s*(20\d{2}|19\d{2})\b/g) || [];
  for (const range of dateRanges) {
    const years = range.match(/\b\d{4}\b/g);
    if (years && years.length === 2 && parseInt(years[0], 10) > parseInt(years[1], 10)) {
      criticalIssues.push({
        type: 'date_inconsistency',
        title: 'Reversed Chronological Date Range',
        problem_found: `Found reversed date range "${range}".`,
        why_it_matters: 'Inverted dates create immediate confusion and can cause ATS parsers to miscalculate your total years of experience.',
        how_to_fix: `Update date order so start year precedes end year (e.g. "${years[1]} – ${years[0]}").`,
        location: 'Experience / Education Dates',
      });
    }
  }

  // 2. Summary/Objective Check
  if (structure.summary.state === 'NOT_DETECTED') {
    if (careerStage === 'senior_lead') {
      sectionOptimizations.push({
        section_name: 'Executive Summary',
        action: 'strengthen',
        reason: 'Senior profiles benefit from a 2-3 line executive summary to frame broad cross-functional scope and leadership domain.',
        why_it_matters: 'Gives recruiters a high-level thesis of your senior trajectory within 5 seconds.',
        recommendation: 'Consider adding a concise 2-sentence executive summary focusing on leadership scope, key domain, and business impact.',
      });
    } else {
      sectionOptimizations.push({
        section_name: 'Professional Summary',
        action: 'keep',
        reason: 'Standard section flow is prioritized for this career stage; an objective statement is omitted to maximize room for high-impact projects and technical skills.',
        why_it_matters: 'Early-career candidates demonstrate readiness best through concrete technical projects and coursework rather than summary text.',
        recommendation: 'Keep standard section flow focused on Education, Technical Skills, Projects, and Achievements.',
      });
    }
  }

  // 3. Passive Phrasing & Action Verbs
  const weakBulletsFound: { bullet: string; pattern: string; replacementVerb: string; location: string }[] = [];
  for (const b of bullets) {
    for (const p of GENERIC_PATTERNS) {
      if (p.match.test(b.bullet)) {
        weakBulletsFound.push({
          bullet: b.bullet,
          pattern: p.label,
          replacementVerb: p.verb,
          location: `${b.sectionTitle}${b.entryTitle ? ` — ${b.entryTitle}` : ''}`,
        });
        break;
      }
    }
  }

  if (weakBulletsFound.length > 0) {
    const examples = weakBulletsFound.slice(0, 3).map((wb) => {
      let improved = wb.bullet
        .replace(/\bresponsible for\b/i, 'Led the execution of')
        .replace(/\btasked with\b/i, 'Spearheaded')
        .replace(/\bworked on\b/i, 'Architected and built')
        .replace(/\bworked with\b/i, 'Collaborated with cross-functional stakeholders to deliver')
        .replace(/\bhelped (with|to)\b/i, 'Co-developed and implemented')
        .replace(/\bassisted (with|in)\b/i, 'Supported the delivery of')
        .replace(/\b(participated|involved) in\b/i, 'Drove key contributions to')
        .replace(/\b(handled|dealt with)\b/i, 'Managed and optimized');
      
      improved = improved.charAt(0).toUpperCase() + improved.slice(1);

      return {
        original: wb.bullet,
        improved,
        why_improved: 'Replaces passive participation language with decisive, past-tense ownership verbs.',
        metric_guidance: 'Consider adding a verified metric if you have evidence (e.g. latency, scale, user count, or throughput).',
      };
    });

    contentImpact.push({
      title: 'Strengthen Passive & Generic Bullet Openings',
      location: weakBulletsFound[0].location,
      issue_identified: `Identified ${weakBulletsFound.length} bullet${weakBulletsFound.length > 1 ? 's' : ''} starting with passive phrasing (such as "responsible for" or "worked on").`,
      why_it_matters: 'Passive openings obscure whether you owned, delivered, or merely observed the work.',
      how_to_fix: 'Begin each bullet with a direct past-tense action verb detailing the specific action and technical approach.',
      before_after_examples: examples,
    });

    legacyIssues.push({
      category: 'Recruiter note',
      title: `${weakBulletsFound.length} bullet${weakBulletsFound.length === 1 ? '' : 's'} read as passive`,
      detail: `Rewrite passive phrasing using active verbs (e.g. Spearheaded, Built, Streamlined).`,
      severity: 'medium',
    });
  }

  // 4. Bullet-Specific Metric Recognition (Requirements 3, 4, 7)
  if (hasMetrics) {
    strengths.push(`Features strong quantifiable metrics and outcomes (${metricList.slice(0, 4).join(', ')}).`);
    // Identify specifically which bullets lack metrics for targeted advice
    const bulletsWithoutMetrics = bullets.filter((b) => !detectResumeMetrics(b.bullet).hasMetrics);
    if (bulletsWithoutMetrics.length > 0 && bulletsWithoutMetrics.length < bullets.length) {
      candidateInfoNeeded.push({
        item_to_provide: 'Metrics for specific unquantified bullets',
        why_needed: 'Some project bullets contain strong technical achievements that would benefit from concrete scale indicators.',
        suggested_prompt: `Consider adding a verified metric if you have evidence: "${bulletsWithoutMetrics[0].bullet.slice(0, 65)}..."`,
        target_section: bulletsWithoutMetrics[0].sectionTitle,
      });
    }
  } else {
    candidateInfoNeeded.push({
      item_to_provide: 'Quantifiable metrics or scale indicators',
      why_needed: 'Provides concrete evidence of scale, performance, and real-world impact.',
      suggested_prompt: 'Consider adding a verified metric if you have evidence: What scale, user count, latency reduction, or volume did your strongest project handle?',
      target_section: 'Experience / Projects',
    });
    contentImpact.push({
      title: 'Evidence & Measurable Results',
      location: 'Experience & Projects',
      issue_identified: 'Key project or work bullets describe tasks and activities but omit measurable outcomes or scale.',
      why_it_matters: 'Recruiters prioritize candidates who can demonstrate the tangible business or technical results of their work.',
      how_to_fix: 'Consider adding a verified metric if you have evidence for it (e.g. latency, throughput, scale, or user adoption). If exact numbers are not available, describe scale truthfully.',
      before_after_examples: [],
    });
  }

  // 5. Structure & Section Checks (ONLY NOT_DETECTED may report missing)
  if (structure.experience.state === 'DETECTED') {
    strengths.push('Contains structured professional or practical work experience entries.');
  }
  if (structure.projects.state === 'DETECTED') {
    strengths.push('Highlights technical development projects with implementation details.');
  }
  if (structure.skills.state === 'DETECTED') {
    strengths.push('Features an explicit technical skills inventory for recruiter scanning and ATS parsing.');
  }
  if (structure.education.state === 'DETECTED') {
    strengths.push('Lists educational qualifications and academic background.');
  }
  if (structure.achievements.state === 'DETECTED') {
    strengths.push('Highlights competitive achievements, awards, or extracurricular distinctions.');
  }
  if (structure.leadership.state === 'DETECTED') {
    strengths.push('Demonstrates leadership roles and positions of responsibility.');
  }

  // Missing section issues ONLY if genuinely NOT_DETECTED and analysis confidence is not low
  if (structure.skills.state === 'NOT_DETECTED' && analysisConfidence !== 'low') {
    criticalIssues.push({
      type: 'major_ats_problem',
      title: 'Skills Section Not Detected',
      problem_found: 'No dedicated skills or technical stack section was found in the resume.',
      why_it_matters: 'ATS parsers and recruiters rely on a clean skills section to quickly index your technical capabilities against role requirements.',
      how_to_fix: 'Add a categorized Skills section grouped into Languages, Frameworks, and Tools/Platforms.',
      location: 'Skills',
    });
  }

  if (structure.education.state === 'NOT_DETECTED' && careerStage === 'student_fresher' && analysisConfidence !== 'low') {
    criticalIssues.push({
      type: 'missing_essential_info',
      title: 'Education Details Missing',
      problem_found: 'Education credentials were not detected in the resume.',
      why_it_matters: 'For early-career candidates, degree, university name, and graduation timeline are essential baseline screening criteria.',
      how_to_fix: 'Add degree, institution name, field of study, and expected graduation month/year.',
      location: 'Education',
    });
  }

  // 6. Action Verb Variety
  const usedVerbs = ACTION_VERBS.filter((verb) => new RegExp(`\\b${verb}\\b`, 'i').test(norm));
  if (usedVerbs.length >= 4) {
    strengths.push(`Uses a strong variety of active verbs (${usedVerbs.slice(0, 4).join(', ')}).`);
  }

  // 7. Role & Job Description Alignment (Strictly isolated from general resume defects)
  const keywordList = keywordsFromJob(jobDescription);
  const missingKeywords = keywordList.filter((word) => !lower.includes(word)).slice(0, 10);
  const matchedKeywords = keywordList.filter((word) => lower.includes(word));

  const declaredSkills: string[] = [];
  for (const s of rawSections) {
    if (Array.isArray(s.tags)) declaredSkills.push(...s.tags);
    if (Array.isArray(s.skills)) declaredSkills.push(...s.skills.map((sk) => sk.name || ''));
    if (Array.isArray(s.skill_groups)) {
      for (const g of s.skill_groups) if (Array.isArray(g.skills)) declaredSkills.push(...g.skills);
    }
  }

  const allBulletsText = bullets.map((b) => b.bullet.toLowerCase()).join(' ');
  const unprovenSkillsFound: Array<{ skill: string; note: string }> = [];
  for (const sk of declaredSkills) {
    if (sk && sk.trim().length > 1) {
      const skLower = sk.toLowerCase();
      if (!allBulletsText.includes(skLower)) {
        unprovenSkillsFound.push({
          skill: sk,
          note: `Listed in skills section but not referenced with verifiable evidence in any experience or project bullet.`,
        });
      }
    }
  }

  const roleNote = hasJD
    ? (hasRole ? `Evaluated alignment for "${role}" against provided job description.` : 'Evaluated keyword coverage against target job description.')
    : 'Role-specific analysis is unavailable without a target role or job description.';

  const roleSpecific: RoleSpecificImprovements = {
    target_role: role,
    job_description_provided: hasJD,
    role_analysis_limited_note: roleNote,
    strong_matches: matchedKeywords.slice(0, 8),
    missing_important_keywords: missingKeywords.slice(0, 6).map((kw) => ({
      keyword: kw,
      importance: 'High',
      reason: 'Mentioned as a core requirement in the job description.',
    })),
    unproven_skills: unprovenSkillsFound.slice(0, 5),
    experiences_to_emphasize: [],
    unevidenced_claims_to_avoid: [
      'Do not add missing keywords to your skills list unless you have verifiable project or work experience using them.',
    ],
  };

  // 8. Compile Top 5 Highest-Value Improvements (Real resume improvements ONLY)
  let rankCounter = 1;
  for (const crit of criticalIssues.slice(0, 2)) {
    top5.push({
      rank: rankCounter++,
      priority: 'Critical',
      title: crit.title,
      problem_found: crit.problem_found,
      why_it_matters: crit.why_it_matters,
      action_type: 'immediate_fix',
      how_to_fix: crit.how_to_fix,
      location: crit.location,
    });
  }

  for (const ci of contentImpact.slice(0, 2)) {
    if (top5.length < 5) {
      top5.push({
        rank: rankCounter++,
        priority: 'High',
        title: ci.title,
        problem_found: ci.issue_identified,
        why_it_matters: ci.why_it_matters,
        action_type: 'immediate_fix',
        how_to_fix: ci.how_to_fix,
        location: ci.location,
      });
    }
  }

  if (top5.length < 5 && !hasMetrics) {
    top5.push({
      rank: rankCounter++,
      priority: 'High',
      title: 'Add Verifiable Evidence and Metrics Where Available',
      problem_found: 'Key project or experience bullets currently lack measurable scale or impact numbers.',
      why_it_matters: 'Numbers and scale validate candidate claims for technical recruiters.',
      action_type: 'missing_information',
      how_to_fix: 'Consider adding a verified metric if you have evidence (e.g. latency, users, requests, or volume).',
      location: 'Experience / Projects',
    });
  }

  if (top5.length < 5 && structure.experience.state === 'NOT_DETECTED' && careerStage !== 'student_fresher') {
    top5.push({
      rank: rankCounter++,
      priority: 'Medium',
      title: 'Structure Work Experience Entries Clearly',
      problem_found: 'No standard work experience section header was detected.',
      why_it_matters: 'Recruiters expect a clearly titled WORK EXPERIENCE section to quickly review career progression.',
      action_type: 'immediate_fix',
      how_to_fix: 'Group your professional roles under a standard "WORK EXPERIENCE" heading with job title, company, dates, and bulleted achievements.',
      location: 'Experience',
    });
  }

  // 9. Calibrated Score Calculation (No penalty for missing JD)
  const keywordMatch = keywordList.length ? Math.round(((keywordList.length - missingKeywords.length) / keywordList.length) * 100) : 80;
  
  // Structure score credits all detected sections
  let structureBase = analysisConfidence === 'low' ? 80 : 50;
  if (structure.education.state === 'DETECTED') structureBase += 15;
  if (structure.skills.state === 'DETECTED') structureBase += 15;
  if (structure.experience.state === 'DETECTED' || structure.projects.state === 'DETECTED') structureBase += 15;
  if (structure.achievements.state === 'DETECTED' || structure.leadership.state === 'DETECTED') structureBase += 5;
  const structureScore = Math.min(100, structureBase);

  // Impact score credits verified metrics (+25), active verbs (+15), and penalizes passive openings (-3 each)
  let impactBase = analysisConfidence === 'low' ? 70 : 45;
  if (hasMetrics) impactBase += 25;
  impactBase += Math.min(usedVerbs.length * 4, 20);
  impactBase -= Math.min(weakBulletsFound.length * 3, 15);
  const impactScore = Math.min(100, Math.max(40, impactBase));

  // Content quality credits terminology correctness and lack of typos
  let contentBase = 70;
  if (foundTechMistakes.length === 0) contentBase += 15;
  else contentBase -= foundTechMistakes.length * 5;
  if (usedVerbs.length >= 3) contentBase += 10;
  const contentScore = Math.min(100, Math.max(45, contentBase));

  // ATS Readiness: evaluated without penalizing for absence of optional JD
  const atsPenalty = analysisConfidence === 'low' ? 0 : criticalIssues.filter((c) => c.type === 'major_ats_problem').length * 15;
  const atsBase = hasJD ? (structureScore * 0.45 + keywordMatch * 0.35 + 20) : (structureScore * 0.55 + 40);
  const atsScore = Math.round(Math.min(100, Math.max(50, atsBase - atsPenalty)));

  // Overall Score (Weighted)
  const overallScore = Math.round(atsScore * 0.35 + contentScore * 0.35 + impactScore * 0.2 + structureScore * 0.1);

  const atsImprovements: ATSImprovements = {
    parseability_status: criticalIssues.some((c) => c.type === 'major_ats_problem') ? 'Needs Attention' : 'Good',
    ats_score_estimate: atsScore,
    recruiter_readability_balance:
      'Structure maintains a clean hierarchy suitable for automated parsing while preserving scannability for 6-second recruiter reviews.',
    formatting_risks: criticalIssues.filter((c) => c.type === 'major_ats_problem').map((c) => c.problem_found),
    section_header_feedback: structure.skills.state === 'DETECTED'
      ? ['Skills section header is standard and parseable.']
      : structure.skills.state === 'UNCERTAIN'
      ? ['Ensure skills are grouped under a standard "TECHNICAL SKILLS" header.']
      : ['Add standard "TECHNICAL SKILLS" header.'],
    keyword_strategy: hasJD
      ? 'Incorporate missing keywords organically into bullets with verifiable evidence. Never list keywords without supporting project context.'
      : 'Role-specific keyword strategy is available when a target job description is supplied.',
  };

  const executiveSummary = careerStage === 'senior_lead'
    ? 'Senior engineering profile with leadership and architectural scope. Main opportunities are articulating business outcomes and quantifiable team leverage.'
    : careerStage === 'student_fresher'
    ? 'Foundational profile with academic credentials, technical skills inventory, and practical development projects. Priority is upgrading passive action verbs to decisive ownership verbs and providing metrics for key project bullets.'
    : 'Technical profile with practical domain experience. Focus on converting passive responsibility phrasing to active STAR achievement bullets with verified metrics.';

  // 10. Generate Grounded Recruiter 6-Second Glance & Evidence-Backed Screening Questions
  const recruiterStrengths: string[] = [];
  if (structure.skills.state === 'DETECTED') {
    const topSkills = evidenceMap.skills.slice(0, 4).map((s) => s.name);
    if (topSkills.length > 0) {
      recruiterStrengths.push(`Clearly organized technical skill categorization (${topSkills.join(', ')}) facilitates fast initial recruiter indexing.`);
    } else {
      recruiterStrengths.push('Clearly organized technical skill categorization facilitates fast initial recruiter indexing.');
    }
  }
  if (evidenceMap.projects.length > 0) {
    const firstProj = evidenceMap.projects[0];
    const projName = firstProj.title && firstProj.title !== 'Project' ? ` (${firstProj.title})` : '';
    recruiterStrengths.push(`Includes tangible technical project implementation${projName}.`);
  } else if (evidenceMap.experience.length > 0) {
    const firstExp = evidenceMap.experience[0];
    const expName = firstExp.title && firstExp.title !== 'Experience Role' ? ` as ${firstExp.title}` : '';
    recruiterStrengths.push(`Demonstrates practical engineering experience${expName}.`);
  }
  if (hasMetrics && metricList.length > 0) {
    recruiterStrengths.push(`Contains verifiable scale and performance indicators (${metricList.slice(0, 3).join(', ')}).`);
  }
  if (structure.achievements.state === 'DETECTED') {
    recruiterStrengths.push('Highlights competitive achievements and extracurricular distinctions.');
  }

  const recruiterPauses: string[] = [];
  if (foundTechMistakes.length > 0) recruiterPauses.push(`Non-standard technical casing (${foundTechMistakes.slice(0, 2).map((m) => m.found).join(', ')}) may catch a technical recruiter's attention.`);
  if (weakBulletsFound.length > 0) recruiterPauses.push(`${weakBulletsFound.length} bullet${weakBulletsFound.length > 1 ? 's start' : ' starts'} with passive phrasing ("${weakBulletsFound[0].pattern.toLowerCase()}").`);
  if (!hasMetrics) recruiterPauses.push('Project bullets focus heavily on tasks rather than measurable scale or outcomes.');

  // Recruiter Questions strictly grounded in explicit evidence
  const recruiterQuestions = evidenceMap.grounded_questions.map((q) => q.question);

  const interviewProb = analysisConfidence === 'low'
    ? 'Provisional'
    : overallScore >= 80
    ? 'Strong'
    : overallScore >= 65
    ? 'Moderate'
    : 'Needs Polish';

  const recruiterReview: RecruiterReview = {
    first_impression: `Resume presents a ${careerStage.replace('_', ' ')} profile with clear technical foundations. Immediate recruiter readability is strong.`,
    strengths: recruiterStrengths.length > 0 ? recruiterStrengths.slice(0, 4) : ['Resume demonstrates relevant technical background with clear foundational skills.'],
    concerns: recruiterPauses.length > 0 ? recruiterPauses.slice(0, 3) : ['No major recruiter-facing issues identified.'],
    interview_probability: interviewProb,
    likely_recruiter_questions: recruiterQuestions.length > 0 ? recruiterQuestions.slice(0, 3) : [
      'Can you describe the primary technical challenge on your most complex project?',
      'What specific technologies and workflows did you own directly in your day-to-day work?',
    ],
    grounded_questions: evidenceMap.grounded_questions,
  };

  const review: ResumeReview = {
    overall: overallScore,
    ats: atsScore,
    content: contentScore,
    impact: impactScore,
    structure: structureScore,
    career_stage: careerStage,
    career_stage_context: careerStageContext,
    executive_summary: executiveSummary,
    must_fix_count: criticalIssues.length,
    nice_to_have_count: Math.max(1, contentImpact.length + sectionOptimizations.length),
    strengths: strengths.length ? strengths : ['Resume contains foundational career details.'],
    issues: legacyIssues,
    missingKeywords,
    actionVerbs: usedVerbs,

    analysis_confidence: analysisConfidence,
    analysis_confidence_note: analysisConfidenceNote,
    detected_structure: structure,

    evidence_map: evidenceMap,
    recruiter_review: recruiterReview,

    top_5_improvements: top5,
    critical_issues: criticalIssues,
    content_impact_improvements: contentImpact,
    ats_improvements: atsImprovements,
    role_specific_improvements: roleSpecific,
    section_optimization: sectionOptimizations,
    candidate_information_needed: candidateInfoNeeded,
  };

  // Step 11: Validate and Ground Analysis against Evidence Map (Requirement 7 & 17)
  const groundedReview = validateAndGroundAnalysis(review, evidenceMap);

  // Step 12: Run Consistency Check before returning
  return runConsistencyCheck(groundedReview, structure, hasMetrics);
}

export function diffResume(before: ResumeData, after: ResumeData) {
  const beforeLines = new Set(getResumeText(before).split('\n').map((line) => line.trim()).filter(Boolean));
  const afterLines = new Set(getResumeText(after).split('\n').map((line) => line.trim()).filter(Boolean));
  return {
    added: [...afterLines].filter((line) => !beforeLines.has(line)).slice(0, 12),
    removed: [...beforeLines].filter((line) => !afterLines.has(line)).slice(0, 12),
  };
}

