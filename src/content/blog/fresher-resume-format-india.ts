import type { Post } from '@/lib/blog-types';

export const post: Post = {
  slug: 'fresher-resume-format-india',
  title: 'Fresher Resume Format for India: What to Include and What to Skip',
  seoTitle: 'Fresher Resume Format for India (2026)',
  description:
    'The right fresher resume format for India: section order, how to write education and projects, and which old habits to drop (photo, DOB, declaration).',
  excerpt:
    'Indian fresher resumes still carry habits from twenty years ago. Here is the section order that works now, and what to leave off.',
  category: 'India',
  keywords: [
    'fresher resume format',
    'fresher resume format India',
    'resume format for freshers',
    'CV vs resume India',
    'campus placement resume',
  ],
  date: '2026-10-01',
  image: '/blog/fresher-resume-format-india.png',
  imageAlt: 'A clean one-page fresher resume layout with education, projects and skills sections',
  related: ['resume-with-no-experience', 'ats-friendly-resume-format', 'resume-bullet-points-for-freshers'],
  blocks: [
    {
      type: 'p',
      text: `A lot of fresher resumes in India still carry habits that made sense twenty years ago: a passport photo, a date of birth, a father's name, a closing declaration. Today they take up space and add nothing to your case. Here is what to keep, what to drop, and the order that works.`,
    },
    { type: 'h2', text: 'Resume or CV: does the word matter?' },
    {
      type: 'p',
      text: `In India, people use both words for the same thing: a short document you send with a job application. Elsewhere the difference is real. In the US and Canada, a resume is a short, tailored page or two, while a CV is a long academic record. In the UK, "CV" is simply the normal word for a job application.`,
    },
    {
      type: 'p',
      text: `If you are applying abroad, check what the employer asks for. For a fresher, one page is right almost everywhere.`,
    },
    { type: 'h2', text: 'The section order that works' },
    {
      type: 'ol',
      items: [
        `Name and contact details`,
        `Summary or career objective, in two or three lines`,
        `Education, most recent first`,
        `Internships or work experience`,
        `Projects`,
        `Skills, both technical and the soft skills you can back up`,
        `Certifications`,
        `Achievements and extracurriculars`,
      ],
    },
    {
      type: 'p',
      text: `Freshers, especially in campus drives, usually keep Education near the top because recruiters check branch and CGPA first. If your projects or internship are stronger than your marks, move them up. The order is a choice, so make it on purpose.`,
    },
    { type: 'h2', text: 'What goes in the header' },
    {
      type: 'ul',
      items: [
        `Your full name`,
        `One phone number you actually answer`,
        `A professional email address`,
        `City and state, since a full postal address is not needed`,
        `A LinkedIn profile link`,
        `GitHub or a portfolio, if there is real work on it`,
      ],
    },
    { type: 'h2', text: 'How to write the education section' },
    {
      type: 'p',
      text: `List the degree, branch, college, university where relevant, and years. Add your CGPA or percentage in a consistent format, and do the same for Class XII and Class X if the employer expects them.`,
    },
    {
      type: 'p',
      text: `Campus recruiters often set eligibility cut-offs, so do not hide numbers they ask for. If your CGPA is modest, do not draw attention to it. Put stronger sections first and be ready to talk about it if it comes up.`,
    },
    { type: 'h2', text: 'What to leave out' },
    {
      type: 'ul',
      items: [
        `A photo, unless the company explicitly asks for one. It does not help a parser and it takes up space.`,
        `Date of birth, marital status, religion, caste, and your father's name`,
        `The "I hereby declare that the above information is true" paragraph`,
        `Hobbies like "listening to music" that have no link to the role`,
        `Your full postal address`,
        `"References available on request"`,
      ],
    },
    {
      type: 'p',
      text: `Recruiters do not need personal details like age or marital status to shortlist you, and employers abroad generally do not want to see them.`,
    },
    { type: 'h2', text: 'Campus placements versus off-campus applications' },
    {
      type: 'p',
      text: `For campus drives, follow your placement cell's template if they give you one. Consistent resumes make their job easier. For off-campus applications, tailor your resume to each role and keep the layout simple, because portals like company career pages, LinkedIn and Naukri parse your file into form fields. Our [ATS-friendly format checklist](/blog/ats-friendly-resume-format) covers what to avoid.`,
    },
    { type: 'h2', text: 'What a good project entry looks like' },
    {
      type: 'tip',
      title: 'Example only. Replace the details with your own.',
      text: `**Student Attendance Tracker** | React, Node.js, MongoDB\nBuilt a web app that lets faculty mark and export attendance for 120 students across 4 sections.\nDesigned the REST API and database schema, and added a monthly report that replaced a paper register.`,
    },
    {
      type: 'p',
      text: `Notice that it names the tools, says what you personally built, and gives a sense of scale. For more on writing lines like these, see [resume bullet points for freshers](/blog/resume-bullet-points-for-freshers).`,
    },
    { type: 'h2', text: 'If you are applying outside India' },
    {
      type: 'p',
      text: `Conventions around personal details, photos and length vary by country. Build one version per market rather than sending the same file everywhere. In QuantumCV you choose a target country when you generate a resume, with India, the United States, the United Kingdom, the UAE, Canada, Germany, Australia and Singapore available, so keeping separate versions is easy.`,
    },
    {
      type: 'p',
      text: `If you are starting from nothing, begin with our guide to [writing a resume with no experience](/blog/resume-with-no-experience).`,
    },
  ],
  faqs: [
    {
      q: 'Should a fresher resume have a photo in India?',
      a: `Generally no, unless the employer asks for one. A photo does not help automated parsing and uses space you could spend on projects or skills.`,
    },
    {
      q: 'How long should a fresher resume be?',
      a: `One page. If you are struggling to fit it, you are probably including things that do not support the job you want.`,
    },
    {
      q: 'Do I need a declaration at the end of my resume?',
      a: `No. It adds nothing, and recruiters do not expect it.`,
    },
  ],
};
