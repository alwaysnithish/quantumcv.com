/**
 * src/lib/resume-canvas/text-parser.ts
 *
 * Deterministic, non-AI fallback for turning pasted career/resume data into
 * the same AnyData shape used by the resume canvas.
 *
 * Design goals:
 * - Preserve every section that is actually present in the source.
 * - Never invent resume facts, placeholder entries, or missing sections.
 * - Accept both the labelled "Career data" format and reasonably formatted
 *   free-form resume text.
 * - Keep section order from the source whenever possible.
 * - Produce the field names expected by sections.ts (especially skill_groups).
 */

import { AnyData } from './sections';

export interface ParserOptions {
  role?: string;
  country?: string;
  accentColor?: string;
}

type SectionKind =
  | 'summary'
  | 'objective'
  | 'profile'
  | 'personal_statement'
  | 'experience'
  | 'education'
  | 'projects'
  | 'certifications'
  | 'skills'
  | 'skills-bars'
  | 'skills-dots'
  | 'skills-tags'
  | 'achievements'
  | 'hobbies'
  | 'volunteer'
  | 'references'
  | 'custom-text'
  | 'bullet-list';

interface ParsedHeader {
  name: string;
  target_role: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
}

interface ParsedEntry {
  id: string;
  title: string;
  subtitle: string;
  location?: string;
  date_start: string;
  date_end: string;
  bullets: string[];
}

interface ParsedBlock {
  kind: SectionKind;
  title: string;
  lines: string[];
  order: number;
}

function uid(prefix = 's'): string {
  return (
    prefix +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7)
  );
}

function cleanLine(line: string): string {
  return line
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '')
    .replace(/^[\t ]+|[\t ]+$/g, '')
    .trim();
}

function stripBullet(line: string): string {
  return line.replace(/^\s*(?:[-*•●▪‣▸◦]\s*|\d+[.)]\s+)/, '').trim();
}

function isBullet(line: string): boolean {
  return /^\s*(?:[-*•●▪‣▸◦]\s+|\d+[.)]\s+)/.test(line);
}

/**
 * PDF extraction sometimes turns "TECHNICAL SKILLS" into
 * "T E C H N I C A L S K I L L S". Normalize that without changing
 * ordinary text.
 */
function normalizeHeadingText(value: string): string {
  let s = value
    .replace(/[:：]\s*$/, '')
    .replace(/[|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const spacedLetters = s.replace(/(?:^|\s)(?:[a-z]\s+){2,}[a-z](?=\s|$)/g, (m) =>
    m.replace(/\s+/g, '')
  );

  return spacedLetters.replace(/\s+/g, ' ').trim();
}

const SECTION_ALIASES: Record<string, SectionKind> = {
  'professional summary': 'summary',
  summary: 'summary',
  'career summary': 'summary',
  profile: 'profile',
  'professional profile': 'profile',
  'personal statement': 'personal_statement',

  objective: 'objective',
  'career objective': 'objective',

  experience: 'experience',
  'work experience': 'experience',
  employment: 'experience',
  'employment history': 'experience',
  'professional experience': 'experience',

  projects: 'projects',
  'personal projects': 'projects',
  'academic projects': 'projects',
  'selected projects': 'projects',

  education: 'education',
  'educational background': 'education',
  academics: 'education',

  skills: 'skills',
  'technical skills': 'skills',
  'technical skill': 'skills',
  'core skills': 'skills',
  'key skills': 'skills',
  'skills summary': 'skills',

  certifications: 'certifications',
  'certification': 'certifications',
  certificates: 'certifications',
  'courses & certifications': 'certifications',
  'courses and certifications': 'certifications',
  'courses certifications': 'certifications',
  courses: 'certifications',

  achievements: 'achievements',
  achievement: 'achievements',
  awards: 'achievements',
  'honors & awards': 'achievements',
  'honours & awards': 'achievements',

  // Treat standalone "Languages" as a grouped skill category.
  // Example: LANGUAGES -> SKILLS > Languages: Java, Python, C++
  // This prevents the parser from creating a separate Languages section
  // when the user's intent is clearly a grouped skills section.
  languages: 'skills',
  'language skills': 'skills',

  hobbies: 'hobbies',
  interests: 'hobbies',
  'hobbies & interests': 'hobbies',
  'hobbies and interests': 'hobbies',

  'volunteer work': 'volunteer',
  volunteering: 'volunteer',
  volunteer: 'volunteer',

  references: 'references',
  'professional references': 'references',

  'positions of responsibility': 'volunteer',
  'position of responsibility': 'volunteer',
  'leadership & responsibility': 'volunteer',

  'key highlights': 'bullet-list',
  highlights: 'bullet-list',
  'key accomplishments': 'bullet-list',
};

function sectionKindForHeading(line: string): SectionKind | null {
  const normalized = normalizeHeadingText(line);
  return SECTION_ALIASES[normalized] || null;
}

function displaySectionTitle(kind: SectionKind, sourceTitle: string): string {
  const titles: Partial<Record<SectionKind, string>> = {
    summary: 'PROFESSIONAL SUMMARY',
    objective: 'CAREER OBJECTIVE',
    profile: 'PROFILE',
    personal_statement: 'PERSONAL STATEMENT',
    experience: 'EXPERIENCE',
    education: 'EDUCATION',
    projects: 'PROJECTS',
    certifications: 'CERTIFICATIONS',
    skills: 'SKILLS',
    'skills-bars': 'SKILLS',
    'skills-dots': 'SKILLS',
    'skills-tags': 'SKILLS',
    achievements: 'ACHIEVEMENTS',
    hobbies: 'HOBBIES & INTERESTS',
    volunteer: 'VOLUNTEER WORK',
    references: 'REFERENCES',
    'bullet-list': 'KEY HIGHLIGHTS',
  };

  return titles[kind] || sourceTitle.trim().toUpperCase();
}

const LABEL_MAP: Record<string, keyof ParsedHeader> = {
  name: 'name',
  'full name': 'name',
  'job title': 'target_role',
  'target role': 'target_role',
  role: 'target_role',
  title: 'target_role',
  email: 'email',
  phone: 'phone',
  mobile: 'phone',
  location: 'location',
  city: 'location',
  linkedin: 'linkedin',
  github: 'github',
  portfolio: 'portfolio',
  website: 'portfolio',
};

function splitLabel(line: string): { label: string; value: string } | null {
  const match = line.match(/^([^:：]{1,40})\s*[:：]\s*(.*)$/);
  if (!match) return null;
  return {
    label: match[1].trim().toLowerCase(),
    value: match[2].trim(),
  };
}

function parseDateRange(line: string): {
  start: string;
  end: string;
} | null {
  const text = line.trim();

  const range =
    text.match(
      /(.+?)\s*(?:–|—|\s+-\s+|\bto\b)\s*(Present|Current|Now|.+)$/i
    ) || text.match(
      /((?:19|20)\d{2})\s*[–—-]\s*(Present|Current|Now|(?:19|20)\d{2})/i
    );

  if (!range) return null;

  const start = range[1].trim();
  const end = range[2].trim();

  // Prevent ordinary prose containing "to" from becoming a date.
  const looksLikeDate =
    /\d/.test(start) ||
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|present|current|now)\b/i.test(
      start
    );

  if (!looksLikeDate) return null;

  return { start, end };
}

function looksLikeDateLine(line: string): boolean {
  return !!parseDateRange(line);
}

function looksLikeLocation(line: string): boolean {
  return (
    /^(?:|location)\s*/i.test(line) ||
    /,\s*[A-Z]{2}(?:,|\s*$)/.test(line) ||
    /\b(remote|hybrid)\b/i.test(line)
  );
}

function cleanLocation(line: string): string {
  return line.replace(/^\s*/, '').replace(/^location\s*:\s*/i, '').trim();
}

function cleanSubLabel(line: string): string {
  return line.replace(/[:：]\s*$/, '').trim().toLowerCase();
}

const ACTION_VERBS = new Set([
  'built', 'developed', 'designed', 'implemented', 'created', 'led', 'managed',
  'optimized', 'optimised', 'deployed', 'integrated', 'automated', 'reduced',
  'increased', 'improved', 'delivered', 'architected', 'engineered',
  'established', 'streamlined', 'enhanced', 'maintained', 'collaborated',
  'participated', 'wrote', 'fixed', 'debugged', 'configured', 'migrated',
  'refactored', 'launched', 'shipped', 'drove', 'owned', 'initiated',
  'coordinated', 'conducted', 'analyzed', 'analysed', 'tested', 'documented',
  'trained', 'mentored', 'presented', 'negotiated', 'resolved', 'upgraded',
  'audited', 'monitored', 'scaled', 'provisioned', 'containerized',
  'orchestrated', 'authored', 'spearheaded', 'partnered', 'used', 'worked',
  'followed', 'decreased', 'cut', 'grew', 'secured', 'earned', 'organized',
  'organised', 'captained', 'clarified', 'solved', 'programmed', 'managed',
]);

const FILLER_VERBS = ['Built', 'Implemented', 'Developed', 'Delivered', 'Engineered'];

function lowerFirstWord(value: string): string {
  const firstSpace = value.indexOf(' ');
  const first = firstSpace === -1 ? value : value.slice(0, firstSpace);

  if (first.length > 1 && first === first.toUpperCase()) {
    return value;
  }

  return (
    first.charAt(0).toLowerCase() +
    first.slice(1) +
    value.slice(first.length)
  );
}

/**
 * Only lightly improves short feature-like bullets. Existing descriptive
 * bullets are left untouched. This preserves the useful behavior from the
 * older parser without rewriting good source content.
 */
function humanizeBullet(value: string, index: number): string {
  const text = value.trim().replace(/\.$/, '');
  if (!text) return '';

  const firstWord = text
    .split(/\s+/)[0]
    .toLowerCase()
    .replace(/[^a-z]/g, '');

  const wordCount = text.split(/\s+/).length;

  if (ACTION_VERBS.has(firstWord) || wordCount >= 6) {
    return text;
  }

  return `${FILLER_VERBS[index % FILLER_VERBS.length]} ${lowerFirstWord(text)}`;
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = value.trim();
    if (!cleaned) continue;

    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

function extractHeaderAndBlocks(raw: string): {
  header: ParsedHeader;
  blocks: ParsedBlock[];
} {
  const rawLines = raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(cleanLine);

  const lines = rawLines.filter(Boolean);

  const header: ParsedHeader = {
    name: '',
    target_role: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
  };

  const blocks: ParsedBlock[] = [];
  let current: ParsedBlock | null = null;
  let blockOrder = 0;

  const pushCurrent = () => {
    if (!current) return;

    current.lines = current.lines.filter(Boolean);
    if (current.lines.length > 0) {
      blocks.push(current);
    }

    current = null;
  };

  let i = 0;
  let headerComplete = false;

  while (i < lines.length) {
    const line = lines[i];

    const kind = sectionKindForHeading(line);
    if (kind) {
      pushCurrent();
      current = {
        kind,
        title: line.replace(/[:：]\s*$/, '').trim(),
        lines: [],
        order: blockOrder++,
      };
      headerComplete = true;
      i++;
      continue;
    }

    const labelled = splitLabel(line);

    if (!headerComplete && labelled) {
      const key = LABEL_MAP[labelled.label];

      if (key) {
        let value = labelled.value;

        if (!value && lines[i + 1] && !sectionKindForHeading(lines[i + 1])) {
          value = lines[i + 1];
          i++;
        }

        header[key] = value;
        i++;
        continue;
      }
    }

    // Support a common free-form header:
    // Name
    // Software Engineer
    // email@example.com
    // +91...
    if (!headerComplete && i === 0 && !labelled && !looksLikeDateLine(line)) {
      header.name = line;
      i++;
      continue;
    }

    if (!headerComplete && !header.target_role && i === 1) {
      if (
        !line.includes('@') &&
        !/^\+?\d[\d\s().-]{7,}$/.test(line) &&
        !/^https?:\/\//i.test(line)
      ) {
        header.target_role = line;
        i++;
        continue;
      }
    }

    // Contact values can appear without labels in a compact header.
    if (!headerComplete) {
      if (!header.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line)) {
        header.email = line;
      } else if (!header.phone && /^\+?\d[\d\s().-]{7,}$/.test(line)) {
        header.phone = line;
      } else if (!header.linkedin && /linkedin\.com\//i.test(line)) {
        header.linkedin = line;
      } else if (!header.github && /github\.com\//i.test(line)) {
        header.github = line;
      } else if (!header.portfolio && /^https?:\/\//i.test(line)) {
        header.portfolio = line;
      }
      i++;
      continue;
    }

    if (current) {
      current.lines.push(line);
    }

    i++;
  }

  pushCurrent();

  // A labelled Professional Summary may have been parsed as a block. It is
  // intentionally kept as a section, not folded into the header.
  return { header, blocks };
}

function parseSummaryBlock(block: ParsedBlock): AnyData | null {
  const text = block.lines.join(' ').trim();
  if (!text) return null;

  return {
    id: uid(),
    type: block.kind,
    title: displaySectionTitle(block.kind, block.title),
    order: block.order + 1,
    summary_text: text,
  };
}

function parseSkillGroups(lines: string[]): {
  category: string;
  skills: string[];
}[] {
  const groups: { category: string; skills: string[] }[] = [];
  let current: { category: string; skills: string[] } | null = null;

  for (const raw of lines) {
    const line = stripBullet(raw);
    if (!line) continue;

    const colon = line.indexOf(':');

    if (colon > 0 && colon < 50) {
      let category = line.slice(0, colon).trim();
      const value = line.slice(colon + 1).trim();

      // "Languages" inside a skills section means programming languages,
      // not the resume's spoken-language section.
      if (/^(?:languages?|programming languages?|coding languages?)$/i.test(category)) {
        category = 'Programming Languages';
      }

      current = { category, skills: [] };
      groups.push(current);

      if (value) {
        current.skills.push(
          ...value
            .split(/[,;|]/)
            .map((s) => s.trim())
            .filter(Boolean)
        );
      }

      continue;
    }

    // Also accept "Languages Python, C++, Java" style lines.
    // This remains a skill group, never a separate `languages` section.
    const compact = line.match(
      /^([A-Za-z][A-Za-z &/+.-]{1,35})\s+(.+)$/
    );

    if (compact && /[,;|]/.test(compact[2])) {
      const category = /^(?:languages?|programming languages?|coding languages?)$/i.test(compact[1].trim())
        ? 'Programming Languages'
        : compact[1].trim();

      current = {
        category,
        skills: compact[2]
          .split(/[,;|]/)
          .map((s) => s.trim())
          .filter(Boolean),
      };
      groups.push(current);
      continue;
    }

    if (current) {
      current.skills.push(
        ...line
          .split(/[,;|]/)
          .map((s) => s.trim())
          .filter(Boolean)
      );
    } else {
      // A flat skills section is still useful. Put all values in one group
      // rather than dropping the section.
      current = { category: 'Skills', skills: [] };
      groups.push(current);
      current.skills.push(
        ...line
          .split(/[,;|]/)
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
  }

  return groups
    .map((group) => ({
      category: group.category,
      skills: uniqueNonEmpty(group.skills),
    }))
    .filter((group) => group.skills.length > 0);
}

function parseSkillsBlock(block: ParsedBlock): AnyData | null {
  const skill_groups = parseSkillGroups(block.lines);
  if (!skill_groups.length) return null;

  return {
    id: uid(),
    type: 'skills',
    title: displaySectionTitle('skills', block.title),
    order: block.order + 1,
    skill_groups,
  };
}

function parseEntryLines(
  lines: string[],
  kind: SectionKind
): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  let current: ParsedEntry | null = null;
  let bulletIndex = 0;
  let mode: 'normal' | 'description' | 'responsibilities' | 'technologies' = 'normal';

  const finish = () => {
    if (!current) return;

    current.bullets = uniqueNonEmpty(current.bullets);
    if (
      current.title ||
      current.subtitle ||
      current.bullets.length ||
      current.date_start ||
      current.date_end
    ) {
      entries.push(current);
    }

    current = null;
    bulletIndex = 0;
    mode = 'normal';
  };

  const newEntry = (title = ''): ParsedEntry => ({
    id: uid('e'),
    title,
    subtitle: '',
    location: '',
    date_start: '',
    date_end: '',
    bullets: [],
  });

  for (let i = 0; i < lines.length; i++) {
    const original = lines[i];
    const line = original.trim();
    if (!line) continue;

    const subLabel = cleanSubLabel(line);

    if (
      subLabel === 'responsibilities' ||
      subLabel === 'responsibility' ||
      subLabel === 'description' ||
      subLabel === 'technologies' ||
      subLabel === 'technology' ||
      subLabel === 'details'
    ) {
      mode =
        subLabel === 'responsibilities' || subLabel === 'responsibility'
          ? 'responsibilities'
          : subLabel === 'description' || subLabel === 'details'
            ? 'description'
            : 'technologies';
      continue;
    }

    const date = parseDateRange(line);

    if (date) {
      if (!current) current = newEntry();

      current.date_start = date.start;
      current.date_end = date.end;

      // A date after a completed entry usually begins a new entry only when
      // that entry already has a date.
      continue;
    }

    if (looksLikeLocation(line)) {
      if (!current) current = newEntry();
      current.location = cleanLocation(line);
      continue;
    }

    if (isBullet(line)) {
      if (!current) current = newEntry();

      const bullet = stripBullet(line);
      if (bullet) {
        current.bullets.push(
          mode === 'technologies' ? bullet : humanizeBullet(bullet, bulletIndex++)
        );
      }
      continue;
    }

    // Technologies can be supplied as "Technologies: React, Node.js".
    const labelled = splitLabel(line);
    if (labelled) {
      const label = labelled.label;
      const value = labelled.value;

      if (
        /^(technologies|technology|tech stack|stack)$/.test(label) &&
        value
      ) {
        if (!current) current = newEntry();
        current.subtitle = value;
        mode = 'technologies';
        continue;
      }

      if (
        /^(company|organisation|organization|employer|institution|issuer|advisor)$/.test(
          label
        ) &&
        value
      ) {
        if (!current) current = newEntry();
        current.subtitle = value;
        continue;
      }

      if (/^(description|responsibilities|details)$/.test(label)) {
        if (!current) current = newEntry();
        if (value) {
          current.bullets.push(humanizeBullet(value, bulletIndex++));
        }
        mode = label === 'responsibilities' ? 'responsibilities' : 'description';
        continue;
      }
    }

    // If we have no entry yet, this is its title.
    if (!current) {
      current = newEntry(line);
      continue;
    }

    // A non-bullet line following a dated entry is normally the next entry
    // title. Preserve it rather than losing it.
    if (
      current.date_start &&
      (current.title || current.subtitle) &&
      !current.subtitle &&
      kind !== 'achievements'
    ) {
      current.subtitle = line;
      continue;
    }

    if (
      current.date_start &&
      current.subtitle &&
      current.bullets.length === 0
    ) {
      finish();
      current = newEntry(line);
      continue;
    }

    // For projects and experience, a meaningful plain line can be a title
    // continuation or a description.
    if (kind === 'projects' || kind === 'experience' || kind === 'volunteer') {
      if (!current.title) {
        current.title = line;
      } else if (!current.subtitle) {
        current.subtitle = line;
      } else {
        current.bullets.push(humanizeBullet(line, bulletIndex++));
      }
    } else if (kind === 'education') {
      if (!current.title) {
        current.title = line;
      } else if (!current.subtitle) {
        current.subtitle = line;
      } else {
        current.bullets.push(line);
      }
    } else {
      if (!current.title) {
        current.title = line;
      } else {
        current.bullets.push(humanizeBullet(line, bulletIndex++));
      }
    }
  }

  finish();

  return entries.filter(
    (entry) =>
      entry.title ||
      entry.subtitle ||
      entry.bullets.length ||
      entry.date_start ||
      entry.date_end
  );
}

function parseCertificationEntries(lines: string[]): ParsedEntry[] {
  return lines
    .map(stripBullet)
    .filter(Boolean)
    .map((line) => {
      const date = parseDateRange(line);

      if (date) {
        return {
          id: uid('e'),
          title: line,
          subtitle: '',
          date_start: date.start,
          date_end: date.end,
          bullets: [],
        };
      }

      const parts = line.split(/\s+[·|]\s+/);
      return {
        id: uid('e'),
        title: parts[0].trim(),
        subtitle: parts.slice(1).join(' · ').trim(),
        date_start: '',
        date_end: '',
        bullets: [],
      };
    });
}

function parseAchievementEntries(lines: string[]): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  let current: ParsedEntry | null = null;

  const finish = () => {
    if (!current) return;
    if (current.title || current.bullets.length) {
      entries.push(current);
    }
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (isBullet(line)) {
      if (!current) {
        current = {
          id: uid('e'),
          title: '',
          subtitle: '',
          date_start: '',
          date_end: '',
          bullets: [],
        };
      }
      current.bullets.push(stripBullet(line));
      continue;
    }

    if (!current) {
      current = {
        id: uid('e'),
        title: line,
        subtitle: '',
        date_start: '',
        date_end: '',
        bullets: [],
      };
      continue;
    }

    // A new non-bullet achievement becomes a new entry.
    finish();
    current = {
      id: uid('e'),
      title: line,
      subtitle: '',
      date_start: '',
      date_end: '',
      bullets: [],
    };
  }

  finish();

  // If the source used bullets only, turn each bullet into an entry.
  if (entries.length === 1 && !entries[0].title && entries[0].bullets.length) {
    return entries[0].bullets.map((bullet) => ({
      id: uid('e'),
      title: bullet,
      subtitle: '',
      date_start: '',
      date_end: '',
      bullets: [],
    }));
  }

  return entries;
}

function parseLanguageEntries(lines: string[]): ParsedEntry[] {
  return lines
    .map(stripBullet)
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+[·|:-]\s+/);

      return {
        id: uid('e'),
        title: parts[0].trim(),
        subtitle: parts.slice(1).join(' · ').trim(),
        date_start: '',
        date_end: '',
        bullets: [],
      };
    });
}

function sectionFromBlock(block: ParsedBlock): AnyData | null {
  switch (block.kind) {
    case 'summary':
    case 'objective':
    case 'profile':
    case 'personal_statement':
    case 'hobbies':
    case 'references':
      return parseSummaryBlock(block);

    case 'skills':
    case 'skills-bars':
    case 'skills-dots':
    case 'skills-tags':
      return parseSkillsBlock(block);

    case 'achievements': {
      const entries = parseAchievementEntries(block.lines);
      if (!entries.length) return null;

      return {
        id: uid(),
        type: 'achievements',
        title: displaySectionTitle('achievements', block.title),
        order: block.order + 1,
        entries,
      };
    }

    case 'certifications': {
      const entries = parseCertificationEntries(block.lines);
      if (!entries.length) return null;

      return {
        id: uid(),
        type: 'certifications',
        title: displaySectionTitle('certifications', block.title),
        order: block.order + 1,
        entries,
      };
    }

    case 'bullet-list': {
      const bullets = uniqueNonEmpty(block.lines.map(stripBullet));
      if (!bullets.length) return null;

      return {
        id: uid(),
        type: 'bullet-list',
        title: displaySectionTitle('bullet-list', block.title),
        order: block.order + 1,
        bullets,
      };
    }

    case 'volunteer': {
      const entries = parseEntryLines(block.lines, 'volunteer');
      if (!entries.length) return null;

      return {
        id: uid(),
        type: 'experience',
        title: displaySectionTitle('volunteer', block.title),
        order: block.order + 1,
        entries,
      };
    }

    case 'experience':
    case 'projects':
    case 'education': {
      const entries = parseEntryLines(block.lines, block.kind);
      if (!entries.length) return null;

      return {
        id: uid(),
        type: block.kind,
        title: displaySectionTitle(block.kind, block.title),
        order: block.order + 1,
        entries,
      };
    }

    default:
      return null;
  }
}

/**
 * Parse the labelled/free-form career text into an intermediate structure.
 * Unlike the older implementation, section detection is alias-based and
 * section order is preserved.
 */
export function parseCareerDataText(raw: string): {
  header: ParsedHeader;
  sections: AnyData[];
} {
  const { header, blocks } = extractHeaderAndBlocks(raw);

  const sections = blocks
    .map(sectionFromBlock)
    .filter((section): section is AnyData => Boolean(section))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return { header, sections };
}

/**
 * Build the complete AnyData resume object.
 *
 * Important: this function only creates sections supported by evidence in
 * the source text. It does not use demo/default content as a fallback.
 */
export function buildResumeFromText(
  rawCareerData: string,
  opts: ParserOptions = {}
): AnyData {
  const parsed = parseCareerDataText(rawCareerData);
  const h = parsed.header;

  const sections = parsed.sections.map((section, index) => ({
    ...section,
    order: index + 1,
  }));

  return {
    name: h.name || 'Your Full Name',
    email: h.email || '',
    phone: h.phone || '',
    linkedin: h.linkedin || '',
    github: h.github || '',
    location: h.location || '',
    target_role: opts.role || h.target_role || '',
    country: opts.country || 'India',
    ai_confidence: 0,
    ats_score: 0,
    layout_config: {
      accent_color: opts.accentColor || '#2058e8',
    },
    sections,
  };
}

/**
 * Determines whether the input contains enough resume structure to make the
 * deterministic fallback useful.
 */
export function looksParseable(raw: string): boolean {
  if (!raw || raw.trim().length < 20) return false;

  const lines = raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(cleanLine)
    .filter(Boolean);

  const recognisedSections = lines.filter((line) =>
    Boolean(sectionKindForHeading(line))
  ).length;

  const hasEmail = lines.some((line) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line)
  );

  const hasLabelledContact = lines.some((line) => {
    const parsed = splitLabel(line);
    return Boolean(parsed && LABEL_MAP[parsed.label]);
  });

  return recognisedSections >= 1 || hasEmail || hasLabelledContact;
}
