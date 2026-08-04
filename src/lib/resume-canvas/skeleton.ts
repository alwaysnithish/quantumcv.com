/**
 * src/lib/resume-canvas/skeleton.ts
 * Port of getSkeletonData() and SECTION_DEFS from the original builder.js.
 */
import { AnyData } from './sections';

function uid(): string {
  return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}
function euid(): string {
  return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

/** Blank starting resume for "Start from blank" */
export function getSkeletonData(): AnyData {
  return {
    name: 'Your Full Name',
    email: 'your@email.com',
    phone: '+91 98765 43210',
    linkedin: 'linkedin.com/in/yourname',
    github: 'github.com/yourname',
    location: 'City, Country',
    target_role: 'Your Target Role',
    country: 'India',
    career_stage: 'mid',
    ai_confidence: 0,
    ats_score: 0,
    layout_config: { accent_color: '#2563eb' },
    sections: [
      {
        id: uid(),
        type: 'summary',
        title: 'PROFESSIONAL SUMMARY',
        order: 1,
        summary_text:
          'Results-driven professional with a strong track record of delivering measurable impact. Click here to edit — describe your strengths, experience, and goals in 2–3 sentences.',
      },
      {
        id: uid(),
        type: 'experience',
        title: 'EXPERIENCE',
        order: 2,
        entries: [
          {
            id: euid(),
            title: 'Job Title',
            subtitle: 'Company Name',
            location: 'City, Country',
            date_start: 'Jan 2022',
            date_end: 'Present',
            bullets: [
              'Quantify impact: e.g. "Reduced API latency by 40%, serving 100K daily requests"',
              'Led cross-functional team to deliver key project ahead of schedule',
              'Click any bullet to edit — start with a strong past-tense action verb',
            ],
          },
        ],
      },
      {
        id: uid(),
        type: 'education',
        title: 'EDUCATION',
        order: 3,
        entries: [
          {
            id: euid(),
            title: 'Degree Programme',
            subtitle: 'University Name',
            location: 'City',
            date_start: 'Sep 2018',
            date_end: 'Jun 2022',
            bullets: ['GPA / CGPA — include if strong (3.5+/4.0 or 8.5+/10)', 'Relevant coursework or honours'],
          },
        ],
      },
      {
        id: uid(),
        type: 'skills',
        title: 'SKILLS',
        order: 4,
        skill_groups: [
          { category: 'Languages', skills: ['Python', 'JavaScript', 'Java'] },
          { category: 'Frameworks', skills: ['React', 'Django', 'Node.js'] },
          { category: 'Tools', skills: ['Git', 'Docker', 'AWS'] },
        ],
      },
      {
        id: uid(),
        type: 'projects',
        title: 'PROJECTS',
        order: 5,
        entries: [
          {
            id: euid(),
            title: 'Project Name',
            subtitle: 'React · Node.js',
            date_start: '2023',
            date_end: '',
            bullets: ['Built X feature serving Y users', 'Reduced load time by Z%'],
          },
        ],
      },
    ],
  };
}

/** Definitions for every addable section type — port of SECTION_DEFS */
export const SECTION_DEFS: Record<string, () => AnyData> = {
  summary: () => ({ id: uid(), type: 'summary', title: 'PROFESSIONAL SUMMARY', order: 0, summary_text: 'Results-driven professional with a proven track record. Click to edit.' }),
  objective: () => ({ id: uid(), type: 'objective', title: 'CAREER OBJECTIVE', order: 0, summary_text: 'Motivated professional seeking to leverage skills in a challenging new role. Click to edit.' }),
  experience: () => ({
    id: uid(),
    type: 'experience',
    title: 'EXPERIENCE',
    order: 0,
    entries: [
      {
        id: euid(),
        title: 'Job Title',
        subtitle: 'Company Name',
        location: 'City',
        date_start: 'Jan 2024',
        date_end: 'Present',
        bullets: ['Quantify impact — e.g. "Reduced latency by 40%, serving 100K daily users"', 'Led cross-functional team to deliver project 2 weeks early', 'Click any bullet to edit with a strong action verb'],
      },
    ],
  }),
  education: () => ({
    id: uid(),
    type: 'education',
    title: 'EDUCATION',
    order: 0,
    entries: [{ id: euid(), title: 'Degree Programme', subtitle: 'University Name', location: 'City', date_start: 'Sep 2020', date_end: 'Jun 2024', bullets: ['GPA — include only if 3.5+/4.0 or 8.5+/10', 'Relevant coursework, honours, or thesis topic'] }],
  }),
  projects: () => ({
    id: uid(),
    type: 'projects',
    title: 'PROJECTS',
    order: 0,
    entries: [{ id: euid(), title: 'Project Name', subtitle: 'React · Node.js · PostgreSQL', date_start: 'Jan 2024', date_end: 'Mar 2024', bullets: ['Built and deployed full-stack app serving X active users', 'Improved performance by Y% through algorithmic optimisation', 'github.com/yourname/project'] }],
  }),
  certifications: () => ({
    id: uid(),
    type: 'certifications',
    title: 'CERTIFICATIONS',
    order: 0,
    entries: [{ id: euid(), title: 'Certification Name', subtitle: 'Issuing Organisation', date_start: '2024', date_end: 'No Expiry', bullets: ['Credential ID: add here'] }],
  }),
  skills: () => ({
    id: uid(),
    type: 'skills',
    title: 'SKILLS',
    order: 0,
    skill_groups: [
      { category: 'Languages', skills: ['Python', 'JavaScript', 'Java'] },
      { category: 'Frameworks', skills: ['React', 'Django', 'Node.js'] },
      { category: 'Tools', skills: ['Git', 'Docker', 'AWS'] },
    ],
  }),
  'skills-bars': () => ({
    id: uid(),
    type: 'skills-bars',
    title: 'SKILLS',
    order: 0,
    skills: [
      { name: 'Python', level: 90 },
      { name: 'JavaScript', level: 82 },
      { name: 'React', level: 78 },
      { name: 'Django', level: 85 },
      { name: 'SQL', level: 74 },
    ],
  }),
  'skills-tags': () => ({ id: uid(), type: 'skills-tags', title: 'TECHNOLOGIES', order: 0, tags: ['Python', 'JavaScript', 'React', 'Django', 'PostgreSQL', 'Docker', 'AWS', 'Git'] }),
  'skills-dots': () => ({
    id: uid(),
    type: 'skills-dots',
    title: 'COMPETENCIES',
    order: 0,
    skills: [
      { name: 'Problem Solving', level: 5 },
      { name: 'Communication', level: 4 },
      { name: 'Team Leadership', level: 4 },
      { name: 'Project Management', level: 3 },
    ],
  }),
  languages: () => ({ id: uid(), type: 'languages', title: 'LANGUAGES', order: 0, entries: [{ id: euid(), title: 'English', subtitle: 'Native' }, { id: euid(), title: 'Hindi', subtitle: 'Professional' }] }),
  achievements: () => ({ id: uid(), type: 'achievements', title: 'ACHIEVEMENTS', order: 0, entries: [{ id: euid(), title: 'Award / Achievement', subtitle: 'Organisation', date_start: '2024', bullets: ['Describe the award and your accomplishment'] }] }),
  hobbies: () => ({ id: uid(), type: 'custom-text', title: 'HOBBIES & INTERESTS', order: 0, summary_text: 'Photography, hiking, open-source contributions — click to edit.' }),
  volunteer: () => ({ id: uid(), type: 'experience', title: 'VOLUNTEER WORK', order: 0, entries: [{ id: euid(), title: 'Volunteer Role', subtitle: 'Organisation', date_start: '2023', date_end: 'Present', bullets: ['Describe your contribution and impact'] }] }),
  references: () => ({ id: uid(), type: 'custom-text', title: 'REFERENCES', order: 0, summary_text: 'Available upon request.' }),
  'custom-text': () => ({ id: uid(), type: 'custom-text', title: 'CUSTOM SECTION', order: 0, summary_text: 'Click here to write your custom content.' }),
  'bullet-list': () => ({
    id: uid(),
    type: 'bullet-list',
    title: 'KEY HIGHLIGHTS',
    order: 0,
    bullets: ['Add your first bullet point here', 'Click + to add more points', 'Use the ✦ AI button to enhance any point'],
  }),
  table: () => ({
    id: uid(),
    type: 'table',
    title: 'TABLE SECTION',
    order: 0,
    tableData: { hasHeader: true, colWidths: [34, 33, 33], rows: [['Column A', 'Column B', 'Column C'], ['Row 1A', 'Row 1B', 'Row 1C'], ['Row 2A', 'Row 2B', 'Row 2C']] },
  }),
};

export const PREVIEW_DATA: AnyData = {
  name: 'Alex Morgan',
  email: 'alex@email.com',
  phone: '+1 555 0100',
  linkedin: 'linkedin.com/in/alexmorgan',
  github: 'github.com/alexmorgan',
  location: 'Austin, TX',
  target_role: 'Product Designer',
  layout_config: { accent_color: '#2058e8' },
  sections: [
    {
      id: 'p-sum',
      type: 'summary',
      title: 'SUMMARY',
      order: 1,
      summary_text: 'Product designer with 5 years of experience shipping user-centred products across web and mobile.',
    },
    {
      id: 'p-exp',
      type: 'experience',
      title: 'EXPERIENCE',
      order: 2,
      entries: [
        {
          id: 'p-exp-1',
          title: 'Senior Product Designer',
          subtitle: 'Acme Corp',
          location: 'Remote',
          date_start: 'Jan 2022',
          date_end: 'Present',
          bullets: ['Led redesign increasing conversion by 24%', 'Mentored 3 junior designers'],
        },
      ],
    },
    {
      id: 'p-edu',
      type: 'education',
      title: 'EDUCATION',
      order: 3,
      entries: [{ id: 'p-edu-1', title: 'B.Des Product Design', subtitle: 'State University', date_start: '2015', date_end: '2019' }],
    },
    {
      id: 'p-skills',
      type: 'skills',
      title: 'SKILLS',
      order: 4,
      skill_groups: [{ category: 'Tools', skills: ['Figma', 'Sketch', 'Notion'] }],
    },
  ],
};

export const SECTION_TYPE_LABELS: { type: keyof typeof SECTION_DEFS; label: string; icon: string }[] = [
  { type: 'summary', label: 'Summary', icon: '📝' },
  { type: 'objective', label: 'Objective', icon: '🎯' },
  { type: 'experience', label: 'Experience', icon: '💼' },
  { type: 'education', label: 'Education', icon: '🎓' },
  { type: 'projects', label: 'Projects', icon: '🚀' },
  { type: 'certifications', label: 'Certifications', icon: '📜' },
  { type: 'skills', label: 'Skills (grouped)', icon: '🧩' },
  { type: 'skills-bars', label: 'Skill Bars', icon: '📊' },
  { type: 'skills-dots', label: 'Skill Dots', icon: '⚫' },
  { type: 'skills-tags', label: 'Skill Tags', icon: '🏷️' },
  { type: 'languages', label: 'Languages', icon: '🌐' },
  { type: 'achievements', label: 'Achievements', icon: '🏆' },
  { type: 'hobbies', label: 'Hobbies', icon: '🎨' },
  { type: 'volunteer', label: 'Volunteer Work', icon: '🤝' },
  { type: 'references', label: 'References', icon: '📇' },
  { type: 'custom-text', label: 'Custom Text', icon: '✏️' },
  { type: 'bullet-list', label: 'Bullet List', icon: '•' },
  { type: 'table', label: 'Table', icon: '📋' },
];
