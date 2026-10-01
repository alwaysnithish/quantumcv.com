import type { Post } from '@/lib/blog-types';

export const post: Post = {
  slug: 'ats-friendly-resume-format',
  title: 'ATS-Friendly Resume Format: A Plain Checklist',
  seoTitle: 'ATS-Friendly Resume Format Checklist',
  description:
    'A practical checklist for an ATS-friendly resume: layout, fonts, headings, file type, and a two-minute test to see how a parser reads your file.',
  excerpt:
    'Most ATS problems come down to formatting choices that scramble the order of your text. Here is what to do, what to avoid, and how to test it.',
  category: 'ATS and scoring',
  keywords: [
    'ATS friendly resume format',
    'ATS resume template',
    'ATS friendly resume',
    'resume format for ATS',
    'how to make resume ATS friendly',
  ],
  date: '2026-10-01',
  image: '/blog/ats-friendly-resume-format.png',
  imageAlt: 'A single-column ATS-friendly resume layout with standard section headings',
  related: ['free-ats-resume-score-checker-guide', 'fresher-resume-format-india', 'resume-with-no-experience'],
  blocks: [
    {
      type: 'p',
      text: `Making a resume ATS-friendly mostly means making it easy for software that reads text in order, from top to bottom. A handful of formatting choices make that hard, and they are all easy to avoid once you know them.`,
    },
    { type: 'h2', text: 'How parsers read your resume' },
    {
      type: 'p',
      text: `A parser pulls the text out of your file and sorts it into fields using clues like headings, dates, job titles and line order. When the layout is simple, those clues are clear. When text sits inside text boxes, side-by-side columns, tables or images, the order can get scrambled or content can be skipped entirely.`,
    },
    {
      type: 'p',
      text: `The result is that your skills show up under the wrong project, or do not show up at all. If you are new to the idea, [what an ATS score actually measures](/blog/free-ats-resume-score-checker-guide) gives the background.`,
    },
    { type: 'h2', text: 'The checklist' },
    { type: 'h3', text: 'Layout' },
    {
      type: 'ul',
      items: [
        `Use a single column for the main content`,
        `Keep standard margins`,
        `Avoid text boxes, and do not put important details such as contact information in the page header or footer, where some parsers skip them`,
        `Do not build the core of your layout out of tables`,
      ],
    },
    { type: 'h3', text: 'Fonts and text' },
    {
      type: 'ul',
      items: [
        `Use a common font such as Arial, Calibri or Garamond`,
        `Keep body text between 10 and 12 pt`,
        `Use standard round bullet characters`,
        `Keep everything as real text. Never use a screenshot or an image of text.`,
      ],
    },
    { type: 'h3', text: 'Headings' },
    {
      type: 'ul',
      items: [
        `Use conventional names: Summary, Education, Experience, Projects, Skills, Certifications`,
        `Put each heading on its own line`,
        `Order sections so that the most relevant one comes first`,
      ],
    },
    { type: 'h3', text: 'Content' },
    {
      type: 'ul',
      items: [
        `Use one date format throughout, such as Jan 2025 – Mar 2025`,
        `Make the job title, organisation and dates easy to find in every entry`,
        `Use keywords as they are written in the posting, when they are true for you`,
        `Write out an acronym once if the posting uses the long form, for example "Search Engine Optimisation (SEO)"`,
      ],
    },
    { type: 'h3', text: 'The file' },
    {
      type: 'ul',
      items: [
        `Use a PDF with selectable text, unless the application asks for .docx`,
        `Use a plain file name such as firstname-lastname-resume.pdf`,
        `Do not password-protect it`,
      ],
    },
    { type: 'h2', text: 'Skill bars, icons and graphics' },
    {
      type: 'p',
      text: `Creative templates look good and are often perfectly fine when you are emailing a real person. For big company portals, graphics are a bigger risk. A skill bar showing 80% in Python tells a parser nothing, because only the word "Python" gets read, and a human cannot tell what 80% means either.`,
    },
    {
      type: 'p',
      text: `If the application really matters, choose the simplest layout available and keep your skills as plain words in a list. QuantumCV has 30 templates from minimal to creative. A sensible approach is to use a minimal one for portal applications and a more designed one when you are sending your resume directly to someone.`,
    },
    { type: 'h2', text: 'Test it yourself in two minutes' },
    {
      type: 'ol',
      items: [
        `Export your resume as a PDF`,
        `Open it and press Ctrl+A (Cmd+A on a Mac). All the text should highlight.`,
        `Paste it into a plain text editor such as Notepad and read the order. It should follow the same order as the page.`,
        `Check that nothing is missing, especially contact details and dates`,
        `Run it through the [free resume analyser](/resumeanalyser)`,
      ],
    },
    {
      type: 'p',
      text: `If the pasted text comes out jumbled, a parser will see the same jumble.`,
    },
    { type: 'h2', text: 'Common myths' },
    {
      type: 'ul',
      items: [
        `**"Hide keywords in white text."** It does not help, it can get you flagged, and a human sees a mess if it is ever revealed.`,
        `**"Word files are safer than PDFs."** Most modern systems read text-based PDFs fine. Scanned PDFs are the problem.`,
        `**"A perfect score guarantees an interview."** It does not. Content and fit still decide that.`,
        `**"One page is a rule everywhere."** It is the norm for freshers, but if a portal gives different guidance, follow that.`,
      ],
    },
    {
      type: 'p',
      text: `A clean layout is only the first half. The other half is what you write on it, which we cover in [how to write a resume with no experience](/blog/resume-with-no-experience) and the guide to [fresher resume format for India](/blog/fresher-resume-format-india).`,
    },
  ],
  faqs: [
    {
      q: 'Can an ATS read PDFs?',
      a: `Most can read PDFs that contain real text. A scanned PDF or a PDF made from images cannot be read.`,
    },
    {
      q: 'Are two-column resumes bad for ATS?',
      a: `They can be risky, because some parsers merge columns line by line and scramble the order. A single column is the safe choice.`,
    },
    {
      q: 'Does the file name matter?',
      a: `Not to the parser, but a clear name like firstname-lastname-resume.pdf helps the person who has to find your file later.`,
    },
  ],
};
