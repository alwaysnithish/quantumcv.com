export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'tip'; title?: string; text: string }
  | { type: 'compare'; before: string; after: string; note?: string };

export type Faq = { q: string; a: string };

export type Post = {
  slug: string;
  /** H1 shown on the page */
  title: string;
  /** <title> tag. Keep under ~46 chars; the layout template adds " — QuantumCV" */
  seoTitle: string;
  /** meta description, ~150 chars */
  description: string;
  /** short teaser used on cards */
  excerpt: string;
  category: string;
  keywords: string[];
  /** ISO date (YYYY-MM-DD). Posts dated in the future stay hidden until that day. */
  date: string;
  updated?: string;
  /** file lives in public/blog/, e.g. /blog/resume-with-no-experience.png (1200x630) */
  image: string;
  imageAlt: string;
  blocks: Block[];
  faqs: Faq[];
  /** slugs of related posts */
  related: string[];
};
