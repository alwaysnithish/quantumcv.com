import type { Post } from '@/lib/blog-types';

export const post: Post = {
  slug: 'resume-bullet-points-for-freshers',
  title: 'Resume Bullet Points for Freshers, With Before-and-After Examples',
  seoTitle: 'Resume Bullet Points for Freshers',
  description:
    'A simple formula for resume bullet points, six before-and-after examples for students, action verbs by category, and what to do when you have no numbers.',
  excerpt:
    'Recruiters skim the first few words of each bullet. If yours start with "Responsible for", you have wasted them. Here is a better formula.',
  category: 'Writing',
  keywords: [
    'resume bullet points',
    'resume bullet points for freshers',
    'resume action verbs',
    'how to write resume bullet points',
    'resume examples for students',
  ],
  date: '2026-10-01',
  image: '/blog/resume-bullet-points-for-freshers.png',
  imageAlt: 'Weak resume bullet points rewritten into specific bullets with numbers',
  related: ['resume-with-no-experience', 'how-to-use-ai-resume-builder', 'free-ats-resume-score-checker-guide'],
  blocks: [
    {
      type: 'p',
      text: `Bullet points are where a fresher resume wins or loses. Recruiters skim, and they mostly read the first few words of each bullet. If those words are "Responsible for", you have wasted the best space on the page.`,
    },
    { type: 'h2', text: 'A formula that works' },
    {
      type: 'p',
      text: `Start with a strong verb, say what you did, and finish with the result or scale. Not every bullet will have all three parts, but aim for at least two.`,
    },
    {
      type: 'ul',
      items: [
        `**Action:** built, analysed, organised, reduced`,
        `**What:** the thing you did, with the tool or method you used`,
        `**Result or scale:** numbers, people affected, time saved, or what got shipped`,
      ],
    },
    { type: 'h2', text: 'Before and after examples' },
    {
      type: 'p',
      text: `The numbers below are examples only. Use your own real ones.`,
    },
    { type: 'h3', text: 'A personal project' },
    {
      type: 'compare',
      before: `Created a weather app.`,
      after: `Built a weather app in React using a public API, with city search and a 5-day forecast, and tested it with 30 classmates.`,
    },
    { type: 'h3', text: 'An internship' },
    {
      type: 'compare',
      before: `Worked on data entry and reports during internship.`,
      after: `Cleaned and merged three sales spreadsheets (about 8,000 rows) in Excel and built a weekly report that replaced a manual process.`,
    },
    { type: 'h3', text: 'A college club or fest' },
    {
      type: 'compare',
      before: `Was part of the marketing team of the college fest.`,
      after: `Led a four-person team that promoted the college fest on Instagram and WhatsApp groups, reaching 900 ticket sales.`,
    },
    { type: 'h3', text: 'A part-time job' },
    {
      type: 'compare',
      before: `Handled customers at a cafe.`,
      after: `Served 80+ customers per shift at a busy cafe, handling billing and orders accurately during peak hours.`,
    },
    { type: 'h3', text: 'An academic project' },
    {
      type: 'compare',
      before: `Did research on solar energy for final-year project.`,
      after: `Compared three solar panel tilt angles over 14 days of measured data and recommended the best option for our campus.`,
    },
    { type: 'h3', text: 'A course or certification' },
    {
      type: 'compare',
      before: `Learned Python from Coursera.`,
      after: `Completed a Python course and wrote a script that renamed and sorted 1,200 files by date.`,
      note: `Notice that every "after" line is something you could be asked about in an interview. That is the test.`,
    },
    { type: 'h2', text: 'Verbs worth using' },
    {
      type: 'p',
      text: `Pick verbs that describe what you actually did. Grouping them by type of work makes it easier to find the right one:`,
    },
    {
      type: 'ul',
      items: [
        `**Building:** built, developed, designed, implemented, deployed, automated`,
        `**Analysing:** analysed, compared, tested, measured, audited, evaluated`,
        `**Leading:** led, organised, coordinated, mentored, managed, launched`,
        `**Improving:** reduced, improved, streamlined, optimised, increased, simplified`,
        `**Communicating:** presented, wrote, trained, negotiated, documented, pitched`,
      ],
    },
    {
      type: 'p',
      text: `Try not to repeat the same verb all the way down the page, but do not reach for a fancier one that is not accurate. "Orchestrated" for something you simply organised reads worse than "organised".`,
    },
    { type: 'h2', text: 'What to do when you have no numbers' },
    {
      type: 'p',
      text: `You almost always have some number to work with. Ask yourself:`,
    },
    {
      type: 'ul',
      items: [
        `How many people used it, attended it, or worked on it?`,
        `How many records, rows, pages or items were involved?`,
        `How long did it take, or how much time did it save?`,
        `How often did you do it, such as weekly or per shift?`,
      ],
    },
    {
      type: 'p',
      text: `If none of those apply, describe the outcome in specific terms instead: what changed, who benefited, and what got delivered.`,
    },
    {
      type: 'p',
      text: `Never round up generously. Saying "about 100 users" when you had 62 is not rounding. It is a false claim, and an interviewer can ask you about it.`,
    },
    { type: 'h2', text: 'Bullet-writing mistakes to avoid' },
    {
      type: 'ul',
      items: [
        `Starting with "Responsible for" or "Worked on"`,
        `Listing tools with no outcome attached`,
        `Writing paragraph-length bullets. Aim for one or two lines.`,
        `Mixing tenses. Use present tense for a current role and past tense for finished ones.`,
        `Writing seven bullets for a one-week task`,
        `Giving every bullet the same structure`,
      ],
    },
    {
      type: 'p',
      text: `Three or four bullets per entry is usually enough. Put the strongest one first.`,
    },
    { type: 'h2', text: 'Fixing weak lines faster' },
    {
      type: 'p',
      text: `If you are stuck on one weak line, QuantumCV's bullet enhancer rewrites a single line into an action-led, quantified version for one credit. It can improve structure, but it cannot know your real numbers, so fill those in yourself.`,
    },
    {
      type: 'p',
      text: `Then run the result through three questions: is it true, is it specific, and does it sound like me? For the bigger picture of a first resume, read [how to write a resume with no experience](/blog/resume-with-no-experience), and see how [AI resume builders](/blog/how-to-use-ai-resume-builder) fit into the process.`,
    },
  ],
  faqs: [
    {
      q: 'How many bullet points should each job or project have?',
      a: `Three or four. Use fewer for small items, and go beyond that only for your most relevant role.`,
    },
    {
      q: 'Should I use "I" in resume bullets?',
      a: `No. Drop the pronoun and start with the verb.`,
    },
    {
      q: 'Present tense or past tense?',
      a: `Use present tense for something you are still doing, and past tense for everything that is finished.`,
    },
  ],
};
