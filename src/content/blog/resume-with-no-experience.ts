import type { Post } from '@/lib/blog-types';

export const post: Post = {
  slug: 'resume-with-no-experience',
  title: 'How to Write a Resume With No Experience',
  seoTitle: 'Resume With No Experience: Fresher Guide',
  description:
    'No job history? Build a strong one-page fresher resume from projects, coursework, clubs and certifications. Structure, examples and mistakes to avoid.',
  excerpt:
    'Every entry-level posting seems to want experience you do not have yet. Here is how to build a one-page resume from what you already have.',
  category: 'Getting started',
  keywords: [
    'resume with no experience',
    'fresher resume',
    'resume for students',
    'first resume',
    'how to write a resume with no experience',
  ],
  date: '2026-10-01',
  image: '/blog/resume-with-no-experience.png',
  imageAlt: 'A fresher reviewing a one-page resume built from projects and coursework',
  related: ['resume-bullet-points-for-freshers', 'fresher-resume-format-india', 'ats-friendly-resume-format'],
  blocks: [
    {
      type: 'p',
      text: `Almost every entry-level job posting asks for a year or two of experience, and you are holding a resume with a degree and not much else. That is the position nearly every fresher is in, and the people hiring for junior roles know it. They are not expecting a work history. They want some evidence that you can learn, finish things, and explain yourself clearly.`,
    },
    {
      type: 'p',
      text: `This guide shows you how to build a one-page resume from what you already have: coursework, projects, college activities, certifications. You can follow it by hand, or use it as a checklist when you [build your resume with QuantumCV](/login).`,
    },
    { type: 'h2', text: 'What counts as experience when you have no job history' },
    {
      type: 'p',
      text: `Experience is any situation where you did real work and can describe what came of it. Employers reading fresher resumes are flexible about where it came from. Write down everything that applies from this list, even the things that feel small:`,
    },
    {
      type: 'ul',
      items: [
        `Academic or personal projects: a website, an app, a research paper, your final-year project`,
        `Internships, including short, unpaid, or remote ones`,
        `Part-time jobs, tutoring, or freelance gigs, even if they have nothing to do with your field`,
        `College clubs, student committees, fests and societies, especially if you ran something`,
        `Hackathons, coding contests, case competitions and olympiads`,
        `Volunteering, NSS, NCC and similar programmes`,
        `Certifications and online courses where you built something at the end`,
      ],
    },
    {
      type: 'p',
      text: `A shift at a tea stall teaches you to work under pressure and deal with customers. Organising your department's annual fest teaches budgeting, coordination and deadlines. Those skills carry over to a first job. What matters is writing them up as work you did, not as a title you held.`,
    },
    { type: 'h2', text: 'Pick a structure that puts your strengths first' },
    {
      type: 'p',
      text: `The usual order, work experience first and education last, does nothing for you yet. Use this order instead:`,
    },
    {
      type: 'ol',
      items: [
        `**Header:** name, phone, a professional email, your city, and links to LinkedIn, GitHub or a portfolio if they are worth clicking`,
        `**Summary:** two or three lines on who you are and the role you want`,
        `**Education:** degree, college, years, and CGPA or percentage if it works in your favour`,
        `**Projects:** your strongest two or three, covering what you built and what happened`,
        `**Internships or experience:** only if you have any`,
        `**Skills:** grouped by type, and matched to the job posting wherever it is honest to do so`,
        `**Certifications and achievements:** only the relevant ones`,
      ],
    },
    {
      type: 'p',
      text: `If you have an internship or a serious club role, move it above Projects. If not, Projects is your experience section and you should treat it that way.`,
    },
    { type: 'h2', text: 'Write a summary that says something' },
    {
      type: 'p',
      text: `A summary is not the place for "hardworking and passionate fresher seeking a challenging opportunity". Every fresher writes that, so it tells the reader nothing. Say what you studied, what you can do, and what you are aiming for.`,
    },
    {
      type: 'compare',
      before: `Hardworking and motivated fresher looking for a challenging role in a reputed organisation.`,
      after: `Final-year B.Tech (CSE) student who built and deployed two full-stack apps in React and Node.js. Looking for a junior web developer role on a customer-facing product.`,
      note: `The second version names a degree, a skill, some proof, and a target. A recruiter can place you within ten seconds.`,
    },
    { type: 'h2', text: 'Turn projects and activities into bullet points' },
    {
      type: 'p',
      text: `Each bullet should say what you did, how you did it, and what came of it. A reliable pattern is action verb, then what you built or handled, then the result or scale. For a longer walkthrough with more examples, read our guide to [resume bullet points for freshers](/blog/resume-bullet-points-for-freshers).`,
    },
    {
      type: 'compare',
      before: `Made a library management system using Java.`,
      after: `Built a library management system in Java and MySQL that tracked 500+ book records, with search by title, author and ISBN.`,
      note: `Use numbers that are true. If you have no result to report, scale still works: how many users, records, teammates or days.`,
    },
    {
      type: 'p',
      text: `Do not invent metrics. Interviewers ask about them, and a number you cannot explain is worse than no number at all.`,
    },
    { type: 'h2', text: 'Match your resume to each job posting' },
    {
      type: 'p',
      text: `Open the job description and mark the skills and tools it mentions more than once. If you genuinely have them, make sure those exact words appear in your skills section or bullets. If the posting says "SQL" and your resume only says "databases", software that scans for keywords may not connect the two.`,
    },
    {
      type: 'p',
      text: `You do not need to rewrite the whole resume for each application. Reorder your skills, adjust a few bullets, and you are done in about ten minutes. We explain how scoring tools treat keywords in [what an ATS score actually measures](/blog/free-ats-resume-score-checker-guide).`,
    },
    { type: 'h2', text: 'Keep the design plain' },
    {
      type: 'p',
      text: `Stick to one page, a readable font at 10 to 11 pt, one date format throughout, and margins you would be happy to read. Save it as a PDF named something like firstname-lastname-resume.pdf, then check that you can select the text with your cursor. If you cannot, a parser will not be able to read it either. The details are in our [ATS-friendly resume format checklist](/blog/ats-friendly-resume-format).`,
    },
    { type: 'h2', text: 'Mistakes that cost freshers interviews' },
    {
      type: 'ul',
      items: [
        `A joke email address. Use a plain, name-based one.`,
        `Two or three pages of filler when one page of substance would do`,
        `Listing skills you could not answer a basic question about`,
        `Lists of soft skills like "team player" and "quick learner" with no evidence behind them`,
        `Typos in tool names, such as "Javascript" or "Github" instead of JavaScript and GitHub`,
        `Links to a GitHub or portfolio that are empty, private, or broken`,
      ],
    },
    {
      type: 'tip',
      title: 'Before you send it',
      text: `Read the resume aloud once, then open every link in a private browser window. Both checks take two minutes and catch more than you would expect.`,
    },
    { type: 'h2', text: 'Build the first draft faster' },
    {
      type: 'p',
      text: `If you would rather not start from a blank page, paste your education, projects and skills into QuantumCV in your own words and choose a target role. The AI structures it into a resume, you adjust it by chatting, and the free ATS score shows what to fix before you apply.`,
    },
    {
      type: 'p',
      text: `The output is only as good as the notes you give it, so spend ten minutes writing them properly. [Start building free](/login).`,
    },
  ],
  faqs: [
    {
      q: 'Can I write a resume with no experience and no projects?',
      a: `You can, but it is worth spending a weekend fixing that first. Build one small thing related to the role you want, or take responsibility for something at college. Until then, lead with education, coursework and skills, and include any part-time work.`,
    },
    {
      q: 'Should a fresher resume be one page?',
      a: `Yes. One page is the norm for freshers, and the limit forces you to keep only what supports the role you are applying for.`,
    },
    {
      q: 'Should I include my CGPA?',
      a: `If it is decent, yes. Some campus recruiters set a cut-off and will ask for it anyway. If it is low, put projects and skills first, but do not misstate it if you are asked.`,
    },
  ],
};
