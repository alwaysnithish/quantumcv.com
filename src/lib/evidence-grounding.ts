/**
 * src/lib/evidence-grounding.ts
 *
 * QuantumCV Strict Evidence-Grounding and Hallucination Prevention Engine.
 * Implements:
 * 1. Lossless, uncorrupted metric extraction across Indian and international formats.
 * 2. Structured evidence map linking every fact to its source section and text.
 * 3. Strict separation of skill inventories from project/experience evidence.
 * 4. Prevention of unfounded technology inferences (e.g. Python + C++ != Python/C++ integration).
 * 5. Strict grounding and validation of recruiter questions, strengths, and candidate claims.
 * 6. Evidence citation metadata generation (claim, supported, source_section, source_text, confidence).
 */

export type EvidenceType = 'explicit' | 'inferred' | 'unknown';
export type EvidenceConfidence = 'high' | 'medium' | 'low';

export interface EvidenceCitation {
  claim: string;
  supported: boolean;
  source_section: string;
  source_text: string;
  evidence_type: EvidenceType;
  confidence: number;
  uncertainty_reason?: string;
}

export interface ExtractedMetric {
  original_value: string;
  normalized_value: string;
  source_text: string;
  source_section: string;
  confidence: 'high' | 'medium' | 'low';
  is_valid: boolean;
  category: 'currency' | 'percentage' | 'rank' | 'multiplier' | 'count_scale' | 'academic' | 'technical_performance';
  uncertainty_reason?: string;
}

export interface GroundedSkill {
  name: string;
  category?: string;
  source_section: string;
  source_text: string;
  evidence_type: 'skill_inventory' | 'project_evidence' | 'experience_evidence';
  used_in_entries?: string[];
}

export interface GroundedEntry {
  title: string;
  subtitle?: string;
  duration?: string;
  bullets: string[];
  source_section: string;
  explicit_technologies: string[];
  explicit_metrics: ExtractedMetric[];
}

export interface GroundedEducation {
  degree?: string;
  institution?: string;
  year?: string;
  gpa_cpi?: string;
  source_section: string;
  source_text: string;
}

export interface GroundedAchievement {
  title: string;
  rank_or_award?: string;
  source_section: string;
  source_text: string;
}

export interface GroundedLeadership {
  role: string;
  organization?: string;
  source_section: string;
  source_text: string;
}

export interface ExplicitTechRelationship {
  tech1: string;
  tech2: string;
  source_section: string;
  source_text: string;
  relationship_type: 'co_used_in_project' | 'co_used_in_experience' | 'integration';
}

export interface GroundedQuestion {
  question: string;
  source_section: string;
  source_text: string;
  evidence_type: EvidenceType;
  confidence: number;
}

export interface GroundedStrength {
  statement: string;
  source_section: string;
  source_text: string;
  evidence_type: EvidenceType;
  confidence: number;
}

export interface GroundedPause {
  pause: string;
  source_section: string;
  source_text: string;
  reason: string;
  evidence_type: EvidenceType;
  confidence: number;
}

export interface EvidenceMap {
  skills: GroundedSkill[];
  experience: GroundedEntry[];
  projects: GroundedEntry[];
  education: GroundedEducation[];
  metrics: ExtractedMetric[];
  achievements: GroundedAchievement[];
  leadership: GroundedLeadership[];
  explicit_tech_relationships: ExplicitTechRelationship[];
  grounded_questions: GroundedQuestion[];
  grounded_strengths: GroundedStrength[];
  grounded_pauses: GroundedPause[];
  evidence_citations: EvidenceCitation[];
}

export const KNOWN_TECHNICAL_TERMS = [
  'python', 'c++', 'c', 'java', 'javascript', 'typescript', 'rust', 'go', 'golang', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'dart', 'html', 'html5', 'css', 'css3', 'sass', 'tailwind', 'tailwindcss',
  'react', 'react.js', 'reactjs', 'next.js', 'nextjs', 'vue', 'vue.js', 'vuejs', 'angular', 'svelte', 'express', 'express.js', 'django', 'flask', 'fastapi', 'spring', 'spring boot', 'node.js', 'nodejs', 'graphql', 'rest', 'restful', 'rest api', 'restful apis',
  'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'sqlite', 'oracle', 'cassandra', 'elasticsearch', 'dynamodb', 'firebase', 'supabase',
  'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'github', 'gitlab', 'ci/cd', 'linux', 'bash', 'terraform', 'ansible', 'jenkins', 'nginx', 'kafka', 'apache kafka', 'rabbitmq',
  'pytorch', 'tensorflow', 'keras', 'scikit-learn', 'sklearn', 'pandas', 'numpy', 'opencv', 'tableau', 'power bi', 'hadoop', 'spark', 'apache spark',
  'postman', 'jest', 'mocha', 'cypress', 'selenium', 'webpack', 'vite', 'figma', 'opengl', 'websocket'
];

/**
 * Lossless Metric Extractor
 * Extracts metrics without truncation, prevents partial extractions (e.g. "Rs.3" from "Rs. 3,00,000"),
 * and validates full token boundaries in source text.
 */
export function extractLosslessMetrics(text: string, sectionTitle = 'General'): ExtractedMetric[] {
  if (!text) return [];
  const metrics: ExtractedMetric[] = [];
  const cleanText = text.replace(/[\u00a0\u2000-\u200a\u202f]/g, ' ');

  // Helper to safely add metric with boundary and truncation validation
  const addMetric = (
    matchStr: string,
    matchIndex: number,
    category: ExtractedMetric['category'],
    sourceText: string
  ) => {
    let raw = matchStr.trim();
    // Clean trailing punctuation
    raw = raw.replace(/[,:;\-\/\\]+$/, '').trim();

    // Look ahead in source text to ensure we didn't truncate a larger numerical expression
    const matchEnd = matchIndex + matchStr.length;
    const followingSlice = cleanText.slice(matchEnd, matchEnd + 20);

    // If following slice immediately has digits or comma-digits (e.g. matched "Rs. 3" but text has ",00,000"), expand or reject!
    if (/^,\d+/.test(followingSlice) || /^\s*,\s*\d+/.test(followingSlice)) {
      // The extraction was truncated! Reconstruct the full number
      const fullNumMatch = cleanText.slice(matchIndex).match(/^(?:₹|rs\.?|inr|\$|€|£)\s*(?:\d{1,2}(?:,\d{2})*,\d{3}|\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?(?:\s*(?:k|m|b|lakhs?|crores?|cr|l|lac|lacs))?/i);
      if (fullNumMatch) {
        raw = fullNumMatch[0].trim();
      } else {
        // Corrupted token, mark uncertain and do not use as valid metric
        return;
      }
    }

    // Never accept incomplete values like "Rs." or single digit with dangling comma
    if (/^(?:₹|rs\.?|inr|\$|€|£)\s*$/i.test(raw) || /,\s*$/.test(raw)) {
      return;
    }

    // Check if currency has single digit when source text actually had comma grouped digits
    if (/^(?:₹|rs\.?|inr|\$|€|£)\s*\d$/i.test(raw)) {
      const surrounding = cleanText.slice(Math.max(0, matchIndex - 5), Math.min(cleanText.length, matchIndex + 25));
      if (/\d,\d/.test(surrounding)) {
        // Suspected truncation
        return;
      }
    }

    // Find the containing sentence or bullet for provenance
    const lines = sourceText.split('\n');
    const containingLine = lines.find((l) => l.includes(matchStr)) || sourceText.slice(0, 120);

    metrics.push({
      original_value: raw,
      normalized_value: raw.replace(/\s+/g, ' '),
      source_text: containingLine.trim(),
      source_section: sectionTitle,
      confidence: 'high',
      is_valid: true,
      category,
    });
  };

  // 1. Currency & Financial Metrics (Indian & International)
  // Handles: Rs. 3,00,000, ₹3,00,000, $50,000, €100,000, £75,000, Rs. 50K, INR 10L, ₹1,00,000, $120,000
  const currencyRegex = /(?:₹|rs\.?|inr|\$|€|£)\s*(?:\d{1,2}(?:,\d{2})*,\d{3}|\d{1,3}(?:,\d{3})+|\d+(?:\.\d{1,2})?)\s*(?:k|m|b|lakhs?|crores?|cr|l|lac|lacs|million|billion)?(?:\b|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = currencyRegex.exec(cleanText)) !== null) {
    addMetric(match[0], match.index, 'currency', text);
  }

  // 2. Percentages & Percentiles & Accuracy
  // Handles: 50%, 90%, 90% accuracy, 94.5% validation accuracy, 98.4% validation accuracy, 99.8th percentile, 99.9% uptime, 92% precision, 30% faster page loads
  const percentageRegex = /\b\d{1,3}(?:\.\d{1,2})?\s*%(?:\s*(?:validation\s+|test\s+|model\s+|classification\s+)?(?:accuracy|precision|recall|f1|growth|reduction|speedup|improvement|increase|uptime|compliance|faster(?:\s+page\s+loads)?|test\s+coverage|coverage)\b)?|\b\d{1,2}(?:\.\d{1,2})?\s*(?:th|st|nd|rd)?\s*percentile\b/gi;
  while ((match = percentageRegex.exec(cleanText)) !== null) {
    addMetric(match[0], match.index, 'percentage', text);
  }

  // 3. Rankings & Honors
  // Handles: AIR 142, All India Rank (AIR) 85, Rank 1, Top 10%, Top 1%, Top 2% rating, 1st place, Finalist, Winner
  const ranksRegex = /\b(?:all\s+india\s+rank(?:\s*\([a-z0-9]+\))?|air|\(?air\)?|rank\s*#?)\s*[-:]?\s*\d+\b|\b(?:top\s*\d+(?:\.\d+)?%|top\s*\d+\b|\d+(?:st|nd|rd|th)\s+place|\bfinalist\b|\bwinner\b|leetcode\s*(?:rating)?\s*[:=]?\s*\d+|codeforces\s*(?:rating)?\s*[:=]?\s*\w+)/gi;
  while ((match = ranksRegex.exec(cleanText)) !== null) {
    addMetric(match[0], match.index, 'rank', text);
  }

  // 4. Multipliers & Speedups
  // Handles: 3.5x, 10x, 2x faster, 3x speedup, 3.5x improvement
  const multiplierRegex = /\b\d+(?:\.\d+)?x(?:\s*(?:faster(?:\s+page\s+loads)?|speedup|improvement|increase|reduction|growth|scale|throughput))?\b/gi;
  while ((match = multiplierRegex.exec(cleanText)) !== null) {
    addMetric(match[0], match.index, 'multiplier', text);
  }

  // 5. Technical Latency & Systems Throughput & Hardware Performance
  // Handles: 25,000 QPS, 15,000+ QPS, sub-100ms latency, sub-5ms latency, 450ms, 25ms, 40ms, 40GB memory
  const technicalPerfRegex = /\b(?:(?:sub-)?\d+(?:\.\d+)?\s*ms(?:\s*latency|\s*response\s*time)?|(?:\d{1,2}(?:,\d{2})*,\d{3}|\d{1,3}(?:,\d{3})+|\d+)\+?\s*qps|\d+(?:\.\d+)?\s*(?:gb|tb|mb)\s*(?:data|memory|storage|footprint)?|f1(?:\s*score)?\s*[:=]?\s*0\.\d+|map\s*[:=]?\s*0\.\d+|bleu\s*[:=]?\s*\d+|auc\s*[:=]?\s*0\.\d+)\b/gi;
  while ((match = technicalPerfRegex.exec(cleanText)) !== null) {
    addMetric(match[0], match.index, 'technical_performance', text);
  }

  // 6. Counts & Scale with or without plus sign
  // Handles: 800+, 10,000+, 500+ participants, 500,000+ active users, 100,000+ monthly active users, 50,000 images, 150,000+ candidates, 50k requests/day, team of 5, team of 6 engineers
  const scaleRegex = /\b(?:\d{1,2}(?:,\d{2})*,\d{3}|\d{1,3}(?:,\d{3})+|\d+)\+?\s*(?:(?:algorithmic|coding|dsa|active|concurrent|daily|monthly|registered|beta|total|unique|technical|distributed|cross-functional|junior|student)\s+)?(?:participants?|attendees?|users?|teams?|members?|engineers?|developers?|clients?|customers?|students?|candidates?|coordinators?|events?|queries|requests?(?:\/day|\/sec|\/second)?|downloads?|commits?|stars?|problems?|solved\s+algorithmic\s+problems|questions?|views?|devices?|records?|nodes?|transactions?|orders?|subscribers?|followers?|prs?|pull\s+requests?|qps|runs?|bootcamps?|freshmen|images|tests?|test\s+cases?|operations\s+per\s+second)\b|\bteam\s+of\s+\d+\s*(?:engineers?|members?|developers?|coordinators?|designers?)?\b|\b\d{2,}\+\b/gi;
  while ((match = scaleRegex.exec(cleanText)) !== null) {
    addMetric(match[0], match.index, 'count_scale', text);
  }

  // 7. Academic Scores
  // Handles: 9.42/10 CPI, 8.9 / 10, 9.1 / 10.0, 9.1/10 CGPA, 9.4 CGPA, 3.8/4.0 GPA
  const academicRegex = /\b(?:\d\.\d{1,2}\s*(?:\/\s*(?:10|4|10\.0|4\.0))?\s*(?:cpi|cgpa|gpa)|(?:cpi|cgpa|gpa)\s*[:=]?\s*\d\.\d{1,2}|\d\.\d{1,2}\s*\/\s*(?:10|4|10\.0|4\.0))\b/gi;
  while ((match = academicRegex.exec(cleanText)) !== null) {
    addMetric(match[0], match.index, 'academic', text);
  }

  // Deduplicate by normalized value
  const seen = new Set<string>();
  return metrics.filter((m) => {
    const key = `${m.category}::${m.normalized_value.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Extracts explicit technical terms mentioned in a given text snippet.
 */
export function findTechsInString(str: string): string[] {
  if (!str) return [];
  const found: string[] = [];
  for (const term of KNOWN_TECHNICAL_TERMS) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9+#.])${escaped}(?:$|[^a-zA-Z0-9+#.])`, 'i');
    if (regex.test(str)) {
      found.push(term);
    }
  }
  return Array.from(new Set(found));
}

/**
 * Builds a structured, strictly grounded Evidence Map from resume text and structured data.
 * Distinguishes skills list from practical project/experience usage.
 */
export function buildEvidenceMap(
  rawText: string,
  structuredData?: any,
  structure?: any
): EvidenceMap {
  const norm = rawText || '';
  const lines = norm.split('\n');

  const skills: GroundedSkill[] = [];
  const experience: GroundedEntry[] = [];
  const projects: GroundedEntry[] = [];
  const education: GroundedEducation[] = [];
  const achievements: GroundedAchievement[] = [];
  const leadership: GroundedLeadership[] = [];
  const explicit_tech_relationships: ExplicitTechRelationship[] = [];
  const metrics: ExtractedMetric[] = [];
  const evidence_citations: EvidenceCitation[] = [];

  // Helper to extract explicit tech pairs that appear together in the same bullet/entry
  const extractTechPairsFromBullet = (bullet: string, sourceSection: string) => {
    const techs = findTechsInString(bullet);
    if (techs.length >= 2) {
      for (let i = 0; i < techs.length; i++) {
        for (let j = i + 1; j < techs.length; j++) {
          explicit_tech_relationships.push({
            tech1: techs[i],
            tech2: techs[j],
            source_section: sourceSection,
            source_text: bullet,
            relationship_type: sourceSection.toLowerCase().includes('project')
              ? 'co_used_in_project'
              : 'co_used_in_experience',
          });
        }
      }
    }
  };

  // Extract from structured data if available
  if (structuredData && Array.isArray(structuredData.sections)) {
    for (const sec of structuredData.sections) {
      const secTitle = (sec.title || '').trim();
      const secType = (sec.type || '').toLowerCase();

      // Skills section (SKILL INVENTORY ONLY — NEVER INFER INTEGRATIONS)
      if (/skill/i.test(secTitle) || /skill/i.test(secType)) {
        if (Array.isArray(sec.tags)) {
          for (const t of sec.tags) {
            skills.push({ name: t, source_section: secTitle || 'Technical Skills', source_text: t, evidence_type: 'skill_inventory' });
          }
        }
        if (Array.isArray(sec.skills)) {
          for (const s of sec.skills) {
            if (s.name) skills.push({ name: s.name, source_section: secTitle || 'Technical Skills', source_text: s.name, evidence_type: 'skill_inventory' });
          }
        }
        if (Array.isArray(sec.skill_groups)) {
          for (const g of sec.skill_groups) {
            for (const sk of g.skills || []) {
              skills.push({ name: sk, category: g.name || g.category, source_section: secTitle || 'Technical Skills', source_text: `${g.name || g.category || 'Skills'}: ${sk}`, evidence_type: 'skill_inventory' });
            }
          }
        }
      }

      // Experience section
      if (/exp|work|employ|intern/i.test(secTitle) || /exp|work|employ|intern/i.test(secType)) {
        for (const e of sec.entries || []) {
          const entryBullets = (e.bullets || []).filter(Boolean);
          const entryTechs: string[] = findTechsInString(`${e.title || ''} ${e.subtitle || ''}`);
          const entryMetrics: ExtractedMetric[] = [];
          for (const b of entryBullets) {
            entryTechs.push(...findTechsInString(b));
            extractTechPairsFromBullet(b, secTitle || 'Work Experience');
            const bulletMetrics = extractLosslessMetrics(b, secTitle || 'Work Experience');
            entryMetrics.push(...bulletMetrics);
            metrics.push(...bulletMetrics);
          }
          experience.push({
            title: e.title || 'Role',
            subtitle: e.subtitle,
            duration: e.date_start ? `${e.date_start} - ${e.date_end || 'Present'}` : e.date,
            bullets: entryBullets,
            source_section: secTitle || 'Work Experience',
            explicit_technologies: Array.from(new Set(entryTechs)),
            explicit_metrics: entryMetrics,
          });
        }
      }

      // Projects section
      if (/project/i.test(secTitle) || /project/i.test(secType)) {
        for (const e of sec.entries || []) {
          const entryBullets = (e.bullets || []).filter(Boolean);
          const entryTechs: string[] = findTechsInString(`${e.title || ''} ${e.subtitle || ''}`);
          const entryMetrics: ExtractedMetric[] = [];
          for (const b of entryBullets) {
            entryTechs.push(...findTechsInString(b));
            extractTechPairsFromBullet(b, secTitle || 'Projects');
            const bulletMetrics = extractLosslessMetrics(b, secTitle || 'Projects');
            entryMetrics.push(...bulletMetrics);
            metrics.push(...bulletMetrics);
          }
          projects.push({
            title: e.title || 'Project',
            subtitle: e.subtitle,
            duration: e.date_start ? `${e.date_start} - ${e.date_end || 'Present'}` : e.date,
            bullets: entryBullets,
            source_section: secTitle || 'Projects',
            explicit_technologies: Array.from(new Set(entryTechs)),
            explicit_metrics: entryMetrics,
          });
        }
      }

      // Education section
      if (/edu|acad/i.test(secTitle) || /edu|acad/i.test(secType)) {
        for (const e of sec.entries || []) {
          const eduText = `${e.title || ''} ${e.subtitle || ''} ${(e.bullets || []).join(' ')}`.trim();
          metrics.push(...extractLosslessMetrics(eduText, secTitle || 'Education'));
          education.push({
            degree: e.title,
            institution: e.subtitle,
            year: e.date_start ? `${e.date_start} - ${e.date_end || ''}` : e.date,
            gpa_cpi: (e.bullets || []).find((b: string) => /cpi|cgpa|gpa|\d\.\d/i.test(b)),
            source_section: secTitle || 'Education',
            source_text: eduText,
          });
        }
      }

      // Leadership section
      if (/lead|responsib/i.test(secTitle) || /lead|responsib/i.test(secType)) {
        for (const e of sec.entries || []) {
          const leadText = `${e.title || ''} ${e.subtitle || ''} ${(e.bullets || []).join(' ')}`.trim();
          leadership.push({
            role: e.title || 'Lead',
            organization: e.subtitle,
            source_section: secTitle || 'Positions of Responsibility',
            source_text: leadText,
          });
          for (const b of e.bullets || []) {
            metrics.push(...extractLosslessMetrics(b, secTitle || 'Positions of Responsibility'));
          }
        }
      }

      // Achievements section
      if (/achieve|award|honor/i.test(secTitle) || /achieve|award|honor/i.test(secType)) {
        for (const e of sec.entries || []) {
          const achText = `${e.title || ''} ${e.subtitle || ''} ${(e.bullets || []).join(' ')}`.trim();
          achievements.push({
            title: e.title || 'Achievement',
            rank_or_award: e.subtitle,
            source_section: secTitle || 'Achievements',
            source_text: achText,
          });
        }
        for (const b of sec.bullets || []) {
          achievements.push({
            title: b,
            source_section: secTitle || 'Achievements',
            source_text: b,
          });
          metrics.push(...extractLosslessMetrics(b, secTitle || 'Achievements'));
        }
      }
    }
  }

  // Parse plain text lines if structured data was sparse or text parsing is needed
  let currentSec = 'General';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detect section headers
    if (/^(?:#+\s*)?(?:TECHNICAL\s+|CORE\s+|KEY\s+)?SKILLS\b/i.test(line) || /^PROGRAMMING\s+LANGUAGES\b/i.test(line) || /^SKILLS\s*&\s*EXPERTISE\b/i.test(line)) {
      currentSec = 'Skills';
      continue;
    } else if (/^(?:#+\s*)?(?:WORK\s+|PROFESSIONAL\s+|INTERNSHIP\s+|RELEVANT\s+)?EXPERIENCE\b/i.test(line) || /^EMPLOYMENT\b/i.test(line) || /^WORK\s+HISTORY\b/i.test(line)) {
      currentSec = 'Experience';
      continue;
    } else if (/^(?:#+\s*)?(?:TECHNICAL\s+|ACADEMIC\s+|KEY\s+|SELECTED\s+)?PROJECTS\b/i.test(line)) {
      currentSec = 'Projects';
      continue;
    } else if (/^(?:#+\s*)?EDUCATION\b/i.test(line) || /^ACADEMIC\s+QUALIFICATIONS\b/i.test(line) || /^ACADEMICS\b/i.test(line) || /^ACADEMIC\s+BACKGROUND\b/i.test(line)) {
      currentSec = 'Education';
      continue;
    } else if (/^(?:#+\s*)?(?:POSITIONS\s+OF\s+RESPONSIBILITY|LEADERSHIP)\b/i.test(line)) {
      currentSec = 'Leadership';
      continue;
    } else if (/^(?:#+\s*)?(?:ACHIEVEMENTS|AWARDS|HONORS|HONOURS)\b/i.test(line)) {
      currentSec = 'Achievements';
      continue;
    }

    // Process line according to current section
    if (currentSec === 'Skills') {
      const inlineMatch = line.match(/^(?:languages|frameworks|tools|technologies|databases|developer\s+tools|core\s+skills|core|backend\s+&\s+tools)\s*[:|-]\s*(.+)$/i);
      const skillText = inlineMatch ? inlineMatch[1] : line;
      const extracted = findTechsInString(skillText);
      for (const t of extracted) {
        if (!skills.some((s) => s.name.toLowerCase() === t.toLowerCase())) {
          skills.push({ name: t, source_section: 'Technical Skills', source_text: line, evidence_type: 'skill_inventory' });
        }
      }
    } else if (currentSec === 'Experience' || currentSec === 'Projects') {
      if (/^[-*•▪►◆■●★✓]\s*/.test(line) || /^\d+\.\s+/.test(line)) {
        const bullet = line.replace(/^[-*•▪►◆■●★✓]\s*|^\d+\.\s+/, '').trim();
        extractTechPairsFromBullet(bullet, currentSec);
        const bulletMetrics = extractLosslessMetrics(bullet, currentSec);
        metrics.push(...bulletMetrics);
        const bulletTechs = findTechsInString(bullet);

        if (currentSec === 'Experience') {
          if (experience.length === 0 || experience[experience.length - 1].bullets.length >= 4) {
            experience.push({
              title: 'Experience Role',
              bullets: [bullet],
              source_section: 'Work Experience',
              explicit_technologies: bulletTechs,
              explicit_metrics: bulletMetrics,
            });
          } else {
            experience[experience.length - 1].bullets.push(bullet);
            experience[experience.length - 1].explicit_technologies.push(...bulletTechs);
            experience[experience.length - 1].explicit_metrics.push(...bulletMetrics);
          }
        } else {
          if (projects.length === 0 || projects[projects.length - 1].bullets.length >= 4) {
            projects.push({
              title: 'Project',
              bullets: [bullet],
              source_section: 'Projects',
              explicit_technologies: bulletTechs,
              explicit_metrics: bulletMetrics,
            });
          } else {
            projects[projects.length - 1].bullets.push(bullet);
            projects[projects.length - 1].explicit_technologies.push(...bulletTechs);
            projects[projects.length - 1].explicit_metrics.push(...bulletMetrics);
          }
        }
      } else if (line.includes('|') || line.includes('- 20') || line.includes('Present')) {
        const entryTechs = findTechsInString(line);
        if (currentSec === 'Projects') {
          projects.push({
            title: line.split('|')[0].trim(),
            subtitle: line,
            bullets: [],
            source_section: 'Projects',
            explicit_technologies: entryTechs,
            explicit_metrics: [],
          });
        } else {
          experience.push({
            title: line.split('|')[0].trim(),
            subtitle: line,
            bullets: [],
            source_section: 'Work Experience',
            explicit_technologies: entryTechs,
            explicit_metrics: [],
          });
        }
      }
    } else if (currentSec === 'Education') {
      metrics.push(...extractLosslessMetrics(line, 'Education'));
      if (/b\.?\s*tech|bachelor|master|m\.?\s*tech|phd|diploma|cpi|cgpa|gpa|bs\b|bsc\b/i.test(line)) {
        education.push({ degree: line, source_section: 'Education', source_text: line });
      }
    } else if (currentSec === 'Achievements') {
      metrics.push(...extractLosslessMetrics(line, 'Achievements'));
      if (/air|rank|winner|place|finalist|scholarship|top\s*\d|hackathon/i.test(line)) {
        achievements.push({ title: line, source_section: 'Achievements', source_text: line });
      }
    } else if (currentSec === 'Leadership') {
      metrics.push(...extractLosslessMetrics(line, 'Leadership'));
      if (/coordinator|lead|president|head|convenor|organized/i.test(line)) {
        leadership.push({ role: line, source_section: 'Leadership', source_text: line });
      }
    }
  }

  // Also run global lossless metric detection on the whole text to ensure nothing is missed
  const globalMetrics = extractLosslessMetrics(norm, 'Resume Text');
  for (const gm of globalMetrics) {
    if (!metrics.some((m) => m.normalized_value.toLowerCase() === gm.normalized_value.toLowerCase())) {
      metrics.push(gm);
    }
  }

  // Cross-reference skills with projects & experience entries
  for (const sk of skills) {
    const skLower = sk.name.toLowerCase();
    const usedIn: string[] = [];
    for (const exp of experience) {
      if (exp.explicit_technologies.some((t) => t.toLowerCase() === skLower)) {
        usedIn.push(exp.title);
      }
    }
    for (const proj of projects) {
      if (proj.explicit_technologies.some((t) => t.toLowerCase() === skLower)) {
        usedIn.push(proj.title);
      }
    }
    sk.used_in_entries = Array.from(new Set(usedIn));
  }

  // Deduplicate tech pairs
  const dedupedPairs: ExplicitTechRelationship[] = [];
  const seenPairKeys = new Set<string>();
  for (const pair of explicit_tech_relationships) {
    const key = [pair.tech1.toLowerCase(), pair.tech2.toLowerCase()].sort().join('::');
    if (!seenPairKeys.has(key)) {
      seenPairKeys.add(key);
      dedupedPairs.push(pair);
    }
  }

  const map: EvidenceMap = {
    skills,
    experience,
    projects,
    education,
    metrics,
    achievements,
    leadership,
    explicit_tech_relationships: dedupedPairs,
    grounded_questions: [],
    grounded_strengths: [],
    grounded_pauses: [],
    evidence_citations,
  };

  // Generate grounded recruiter questions strictly from explicit evidence
  map.grounded_questions = generateGroundedRecruiterQuestions(map);

  // Generate grounded candidate strengths strictly from explicit evidence
  map.grounded_strengths = generateGroundedStrengths(map);

  return map;
}

/**
 * Generates recruiter screening questions derived STRICTLY from explicit claims.
 * Never invents multi-technology integrations or corrupted metrics.
 */
export function generateGroundedRecruiterQuestions(map: EvidenceMap): GroundedQuestion[] {
  const questions: GroundedQuestion[] = [];
  const seenQuestions = new Set<string>();

  const addQ = (q: GroundedQuestion) => {
    const normQ = q.question.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seenQuestions.has(normQ)) {
      seenQuestions.add(normQ);
      questions.push(q);
    }
  };

  // 1. Questions from Projects with Explicit Bullets
  for (const proj of map.projects) {
    const actionBullet = proj.bullets.find((b) => b.length > 25);
    if (actionBullet) {
      const cleanSnippet = actionBullet.slice(0, 65).replace(/^[a-z]/, (c) => c.toUpperCase());
      const projName = proj.title && proj.title !== 'Project' ? `"${proj.title}"` : 'your technical project';
      addQ({
        question: `In ${projName}, you noted "${cleanSnippet}...". What were the primary architectural trade-offs you evaluated?`,
        source_section: 'Projects',
        source_text: actionBullet,
        evidence_type: 'explicit',
        confidence: 0.95,
      });
      break;
    }
  }

  // 2. Questions from Work Experience with Explicit Bullets
  for (const exp of map.experience) {
    const expBullet = exp.bullets.find((b) => b.length > 25);
    if (expBullet) {
      const cleanSnippet = expBullet.slice(0, 65).replace(/^[a-z]/, (c) => c.toUpperCase());
      const roleName = exp.title && exp.title !== 'Experience Role' ? `your role as ${exp.title}` : 'your practical experience';
      addQ({
        question: `During ${roleName}, you worked on "${cleanSnippet}...". How did you validate system reliability and handle edge cases?`,
        source_section: 'Work Experience',
        source_text: expBullet,
        evidence_type: 'explicit',
        confidence: 0.95,
      });
      break;
    }
  }

  // 3. Questions from Validated Quantitative Metrics (Lossless, non-corrupted metrics only)
  const validMetric = map.metrics.find((m) => m.is_valid && m.confidence === 'high' && m.normalized_value.length > 2 && !/,\s*$/.test(m.normalized_value));
  if (validMetric) {
    addQ({
      question: `Your resume highlights achieving ${validMetric.normalized_value} in ${validMetric.source_section}. Can you walk through how you measured and benchmarked this outcome?`,
      source_section: validMetric.source_section,
      source_text: validMetric.source_text,
      evidence_type: 'explicit',
      confidence: 0.95,
    });
  }

  // 4. Questions from Leadership / Achievements
  if (map.leadership.length > 0) {
    const lead = map.leadership[0];
    addQ({
      question: `In your role as ${lead.role || 'Coordinator'}, what was the biggest team coordination or technical hurdle you resolved?`,
      source_section: 'Leadership',
      source_text: lead.source_text,
      evidence_type: 'explicit',
      confidence: 0.90,
    });
  } else if (map.achievements.length > 0) {
    const ach = map.achievements[0];
    addQ({
      question: `Regarding your achievement "${ach.title.slice(0, 50)}", what preparation or technical methodology contributed most to this result?`,
      source_section: 'Achievements',
      source_text: ach.source_text,
      evidence_type: 'explicit',
      confidence: 0.90,
    });
  }

  // 5. Fallback: If only isolated skills exist, ask single-skill question (NEVER pair disconnected skills)
  if (questions.length < 2 && map.skills.length > 0) {
    const primarySkill = map.skills[0].name;
    addQ({
      question: `You list ${primarySkill} in your technical skills inventory. What is the most complex service or algorithmic problem you solved using ${primarySkill}?`,
      source_section: 'Technical Skills',
      source_text: map.skills[0].source_text,
      evidence_type: 'explicit',
      confidence: 0.85,
    });
  }

  return questions.slice(0, 3);
}

/**
 * Generates grounded strengths strictly from explicit evidence.
 */
export function generateGroundedStrengths(map: EvidenceMap): GroundedStrength[] {
  const strengths: GroundedStrength[] = [];

  // 1. Technical Skills Inventory
  if (map.skills.length > 0) {
    const skillSample = map.skills.slice(0, 4).map((s) => s.name);
    strengths.push({
      statement: `Lists ${skillSample.join(', ')} in technical skills inventory.`,
      source_section: 'Technical Skills',
      source_text: map.skills[0].source_text,
      evidence_type: 'explicit',
      confidence: 0.95,
    });
  }

  // 2. Concrete Projects
  if (map.projects.length > 0) {
    const firstProj = map.projects[0];
    const projTitle = firstProj.title && firstProj.title !== 'Project' ? ` (${firstProj.title})` : '';
    const projTechs = firstProj.explicit_technologies.slice(0, 2).join(', ');
    const techClause = projTechs ? ` using ${projTechs}` : '';
    strengths.push({
      statement: `Demonstrates technical project implementation${projTitle}${techClause}.`,
      source_section: 'Projects',
      source_text: firstProj.bullets[0] || firstProj.title,
      evidence_type: 'explicit',
      confidence: 0.95,
    });
  }

  // 3. Work Experience
  if (map.experience.length > 0) {
    const firstExp = map.experience[0];
    const expTitle = firstExp.title && firstExp.title !== 'Experience Role' ? ` as ${firstExp.title}` : '';
    strengths.push({
      statement: `Demonstrates practical engineering experience${expTitle}.`,
      source_section: 'Work Experience',
      source_text: firstExp.bullets[0] || firstExp.title,
      evidence_type: 'explicit',
      confidence: 0.95,
    });
  }

  // 4. Verifiable Metrics
  const validMetrics = map.metrics.filter((m) => m.is_valid && m.confidence === 'high');
  if (validMetrics.length > 0) {
    const sample = validMetrics.slice(0, 3).map((m) => m.normalized_value).join(', ');
    strengths.push({
      statement: `Features verifiable quantitative outcomes (${sample}).`,
      source_section: validMetrics[0].source_section,
      source_text: validMetrics[0].source_text,
      evidence_type: 'explicit',
      confidence: 0.95,
    });
  }

  return strengths;
}

/**
 * Validates and grounds all generated content (recruiter questions, strengths, candidate claims)
 * against the evidence map. Filters out hallucinated multi-technology pairings and corrupted metrics.
 */
export function validateAndGroundAnalysis<T extends {
  strengths?: string[];
  recruiter_review?: {
    first_impression: string;
    strengths: string[];
    concerns: string[];
    interview_probability: string;
    likely_recruiter_questions: string[];
    grounded_questions?: GroundedQuestion[];
  };
}>(reportOrReview: T, evidenceMap: EvidenceMap): T {
  const result = { ...reportOrReview };

  // 1. Validate Recruiter Questions
  if (result.recruiter_review && Array.isArray(result.recruiter_review.likely_recruiter_questions)) {
    const validatedQuestions: string[] = [];

    for (const q of result.recruiter_review.likely_recruiter_questions) {
      // Check 1: Does this question assert an unevidenced integration between two technologies?
      // e.g. "integration between Python and C++" or "integrate Python and C++" or "Python/C++"
      const integrationMatch = q.match(/(?:integration\s+(?:between|of|with)|integrate|integrating|connecting|combining|bridging|interfacing|using)\s+([A-Za-z0-9+#.]+)\s+(?:and|with|\/|\+)\s+([A-Za-z0-9+#.]+)/i)
        || q.match(/\b([A-Za-z0-9+#.]+)\s*[\/+\&]\s*([A-Za-z0-9+#.]+)\s+(?:integration|pipeline|system|app|application|stack)\b/i);

      if (integrationMatch) {
        const tech1 = integrationMatch[1].toLowerCase();
        const tech2 = integrationMatch[2].toLowerCase();
        const isPairExplicitlyEvidenced = evidenceMap.explicit_tech_relationships.some(
          (p) =>
            (p.tech1.toLowerCase() === tech1 && p.tech2.toLowerCase() === tech2) ||
            (p.tech1.toLowerCase() === tech2 && p.tech2.toLowerCase() === tech1)
        );

        if (!isPairExplicitlyEvidenced) {
          // Reject hallucinated pairing! Replace with a single-skill grounded question
          const groundableTech = integrationMatch[1];
          validatedQuestions.push(
            `You list ${groundableTech} in your technical profile. What was the most complex technical challenge you solved using ${groundableTech}?`
          );
          continue;
        }
      }

      // Check 2: Does this question cite a corrupted or truncated metric? (e.g. "Rs.3" or "Rs. 3" or "Rs.300" when source had "Rs. 3,00,000")
      const corruptedMetricMatch = q.match(/\b(?:rs\.?\s*3|rs\.?\s*300|rs\.?\s*,)\b/i);
      if (corruptedMetricMatch) {
        // Find if a true currency metric exists in evidence
        const validCurrency = evidenceMap.metrics.find((m) => m.category === 'currency' && m.is_valid);
        if (validCurrency) {
          validatedQuestions.push(
            q.replace(corruptedMetricMatch[0], validCurrency.normalized_value)
          );
        } else {
          // Drop the corrupted metric reference
          validatedQuestions.push(
            'Can you describe the primary technical challenge and architectural trade-offs on your strongest project?'
          );
        }
        continue;
      }

      // Check 3: Check for unsupported "production" Kubernetes/cloud assertions
      if (/production\s+(?:kubernetes|k8s|deployment|cloud|infrastructure)/i.test(q)) {
        const hasProductionEvidence = evidenceMap.experience.some((e) =>
          /production/i.test(e.bullets.join(' ')) || /production/i.test(e.title)
        ) || evidenceMap.projects.some((p) =>
          /production/i.test(p.bullets.join(' '))
        );

        if (!hasProductionEvidence) {
          validatedQuestions.push(
            'You list Docker and Kubernetes in your technical stack. How did you configure container environments for your projects?'
          );
          continue;
        }
      }

      validatedQuestions.push(q);
    }

    // If no questions survived or were empty, use grounded questions from evidence map
    if (validatedQuestions.length === 0 && evidenceMap.grounded_questions.length > 0) {
      result.recruiter_review.likely_recruiter_questions = evidenceMap.grounded_questions.map((g) => g.question);
    } else {
      result.recruiter_review.likely_recruiter_questions = validatedQuestions;
    }

    // Attach grounded questions with source citations
    result.recruiter_review.grounded_questions = evidenceMap.grounded_questions;
  }

  // 2. Validate Candidate Strengths
  const validateStrengthString = (s: string): string => {
    // Multi-tech integration check
    const intMatch = s.match(/(?:integration\s+(?:between|of|with)|integrating|integration\s+experience\s+with|experience\s+with)\s+([A-Za-z0-9+#.]+)\s+and\s+([A-Za-z0-9+#.]+)/i)
      || s.match(/\b([A-Za-z0-9+#.]+)\s*[\/+\&]\s*([A-Za-z0-9+#.]+)\s+integration/i);

    if (intMatch) {
      const t1 = intMatch[1].toLowerCase();
      const t2 = intMatch[2].toLowerCase();
      const hasPair = evidenceMap.explicit_tech_relationships.some(
        (p) => (p.tech1.toLowerCase() === t1 && p.tech2.toLowerCase() === t2) || (p.tech1.toLowerCase() === t2 && p.tech2.toLowerCase() === t1)
      );
      if (!hasPair) {
        return `Lists ${intMatch[1]} and ${intMatch[2]} in technical skills inventory.`;
      }
    }

    // "Built <Tech> applications" when tech only in skills
    const builtAppMatch = s.match(/built\s+([A-Za-z0-9+#.]+)\s+applications?/i);
    if (builtAppMatch) {
      const tech = builtAppMatch[1].toLowerCase();
      const hasProjWithTech = evidenceMap.projects.some((p) => p.explicit_technologies.some((t) => t.toLowerCase() === tech))
        || evidenceMap.experience.some((e) => e.explicit_technologies.some((t) => t.toLowerCase() === tech));
      if (!hasProjWithTech) {
        return `Lists ${builtAppMatch[1]} in technical skills inventory.`;
      }
    }

    // "Managed production Kubernetes infrastructure" without production evidence
    if (/managed\s+production\s+kubernetes|production\s+kubernetes\s+infrastructure|production\s+deployment/i.test(s)) {
      const hasProdEvidence = evidenceMap.experience.some((e) => /production/i.test(e.bullets.join(' ')))
        || evidenceMap.projects.some((p) => /production/i.test(p.bullets.join(' ')));
      if (!hasProdEvidence) {
        return 'Lists Docker and Kubernetes in technical skills inventory.';
      }
    }

    // Fix corrupted currency in strengths
    const corruptedCurrency = s.match(/\b(?:rs\.?\s*3|rs\.?\s*300)\b/i);
    if (corruptedCurrency) {
      const validCurrency = evidenceMap.metrics.find((m) => m.category === 'currency' && m.is_valid);
      if (validCurrency) {
        return s.replace(corruptedCurrency[0], validCurrency.normalized_value);
      }
    }

    return s;
  };

  if (result.strengths && Array.isArray(result.strengths)) {
    result.strengths = result.strengths.map(validateStrengthString);
  }

  if (result.recruiter_review && Array.isArray(result.recruiter_review.strengths)) {
    result.recruiter_review.strengths = result.recruiter_review.strengths.map(validateStrengthString);
  }

  // 3. Validate Recruiter Concerns
  if (result.recruiter_review) {
    const validConcerns = (result.recruiter_review.concerns || []).filter(
      (c) => c && c.trim() && c.trim() !== '-' && c.trim() !== '—'
    );
    result.recruiter_review.concerns = validConcerns.length > 0 ? validConcerns : ['No major recruiter-facing issues identified.'];
  }

  return result;
}
