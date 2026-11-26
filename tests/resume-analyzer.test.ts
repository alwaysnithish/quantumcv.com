import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeExtractedText,
  parseResumeStructure,
  detectResumeMetrics,
  reviewResume,
  runConsistencyCheck,
} from '../src/lib/resume-review.ts';
import { extractTextFromDocument } from '../src/lib/pdf-parser.ts';

describe('Evidence-Based Resume Analysis Engine', () => {
  describe('1. Text Normalization', () => {
    it('normalizes unicode characters, line wraps, ligatures and spaced headers', () => {
      const raw = 'E D U C A T I O N\r\n\r\nB.Tech\u00A0in\u200B Computer\u2010Science\nDevel-\nopment of high\uFB01-grade apps';
      const normalized = normalizeExtractedText(raw);

      assert.ok(normalized.includes('EDUCATION'));
      assert.ok(normalized.includes('Development'));
      assert.ok(normalized.includes('Computer-Science'));
    });
  });

  describe('2. Multi-Pass Section Detection & Headings', () => {
    it('detects standard section headings correctly', () => {
      const resume = `
        John Doe
        john@example.com

        EDUCATION
        B.Tech in Computer Science, IIT Bombay | 2020 - 2024
        CPI: 8.9 / 10

        TECHNICAL SKILLS
        Languages: Python, TypeScript, C++, Java
        Frameworks: React, Next.js, Node.js, Express
        Databases: PostgreSQL, MongoDB, Redis

        WORK EXPERIENCE
        Software Engineer Intern at Acme Corp | May 2023 - July 2023
        - Built distributed caching system reducing latency by 40%
        - Designed REST APIs handling 50k requests/day

        PROJECTS
        QuantumCV - AI Resume Platform
        - Developed full-stack Next.js web application with 99.9% uptime
        - Integrated Gemini API with streaming responses

        POSITIONS OF RESPONSIBILITY
        Lead Organizer, TechFest 2023
        - Managed a team of 30 coordinators across 5 campus events

        ACHIEVEMENTS
        - Secured All India Rank 142 in JEE Advanced
        - Solved 600+ problems on LeetCode with top 2% rating
      `;

      const structure = parseResumeStructure(resume);

      assert.equal(structure.education.state, 'DETECTED');
      assert.equal(structure.skills.state, 'DETECTED');
      assert.equal(structure.experience.state, 'DETECTED');
      assert.equal(structure.projects.state, 'DETECTED');
      assert.equal(structure.leadership.state, 'DETECTED');
      assert.equal(structure.achievements.state, 'DETECTED');
    });

    it('detects variations: Academic Background, Skills & Expertise, Professional Experience', () => {
      const resume = `
        Jane Doe
        ACADEMIC BACKGROUND
        Bachelor of Science in Information Technology, 2024

        SKILLS & EXPERTISE
        Python, Go, Docker, Kubernetes, AWS

        PROFESSIONAL EXPERIENCE
        Software Developer at Cloud Inc
        - Deployed microservices on AWS EKS
      `;

      const structure = parseResumeStructure(resume);

      assert.equal(structure.education.state, 'DETECTED');
      assert.equal(structure.skills.state, 'DETECTED');
      assert.equal(structure.experience.state, 'DETECTED');
    });

    it('detects spaced-out headings (E D U C A T I O N)', () => {
      const resume = `
        E D U C A T I O N
        Stanford University, BS Computer Science 2023

        T E C H N I C A L   S K I L L S
        Python, PyTorch, SQL
      `;

      const structure = parseResumeStructure(resume);

      assert.equal(structure.education.state, 'DETECTED');
      assert.equal(structure.skills.state, 'DETECTED');
    });
  });

  describe('3. Content-Based Fallback Detection', () => {
    it('detects Education from degrees, institutes, and graduation years when heading is missing or malformed', () => {
      const resumeWithoutHeader = `
        Alex Mercer
        alex@test.com | (555) 123-4567

        B.Tech in Computer Science and Engineering
        Indian Institute of Technology, Delhi (2020 - 2024)
        Cumulative GPA: 9.1 / 10.0

        Projects:
        Built a real-time ray tracer in C++ with OpenGL
      `;

      const structure = parseResumeStructure(resumeWithoutHeader);

      assert.equal(structure.education.state, 'DETECTED');
      assert.equal(structure.education.method, 'content_evidence');
      assert.ok(structure.education.evidence.length > 0);
    });

    it('detects Skills from inline category rows (e.g. Languages: Python, C++) without a section header', () => {
      const resumeWithInlineSkills = `
        Alex Mercer
        Languages: Python, TypeScript, Java, C++
        Technologies: React, Docker, Kubernetes, PostgreSQL, Redis

        Experience:
        Full Stack Engineer at Startup X
      `;

      const structure = parseResumeStructure(resumeWithInlineSkills);

      assert.equal(structure.skills.state, 'DETECTED');
      assert.ok(['regex_heading', 'inline_header', 'content_evidence'].includes(structure.skills.method));
    });
  });

  describe('4. 3-State Section Detection & Missing Section Prevention Policy', () => {
    it('only marks NOT_DETECTED when neither heading nor content heuristics find evidence', () => {
      const resumeWithoutLeadership = `
        Alex Mercer
        EDUCATION
        B.S. in Computer Science, 2024
        SKILLS
        Python, JavaScript
      `;

      const structure = parseResumeStructure(resumeWithoutLeadership);

      assert.equal(structure.education.state, 'DETECTED');
      assert.equal(structure.skills.state, 'DETECTED');
      assert.equal(structure.leadership.state, 'NOT_DETECTED');
    });

    it('enforces that DETECTED and UNCERTAIN sections never produce critical missing section defects', () => {
      const resume = `
        Alex Mercer
        EDUCATION
        B.Tech in Computer Science, 2024
        TECHNICAL SKILLS
        Python, React, SQL
        PROJECTS
        E-commerce web app
      `;

      const review = reviewResume(resume);

      // Verify no critical issues claim education or skills are missing
      const criticalTitles = review.critical_issues.map((i) => i.title.toLowerCase());
      assert.ok(!criticalTitles.some((t) => t.includes('education') && t.includes('missing')));
      assert.ok(!criticalTitles.some((t) => t.includes('skills') && t.includes('missing')));

      // Verify no top_5_improvements claim education or skills are missing
      const topTitles = review.top_5_improvements.map((i) => i.title.toLowerCase());
      assert.ok(!topTitles.some((t) => t.includes('education') && t.includes('missing')));
      assert.ok(!topTitles.some((t) => t.includes('skills') && t.includes('missing')));
    });

    it('consistency check prunes any hallucinatory missing-section defects', () => {
      const mockStructure = parseResumeStructure(`
        EDUCATION
        B.Tech Computer Science 2024
        SKILLS
        Python, C++
      `);

      const inconsistentReview = {
        overall: 70,
        ats: 75,
        content: 70,
        impact: 70,
        structure: 75,
        career_stage: 'student_fresher' as const,
        career_stage_context: 'Early career student.',
        must_fix_count: 2,
        nice_to_have_count: 2,
        strengths: [],
        issues: [],
        missingKeywords: [],
        actionVerbs: [],
        analysis_confidence: 'high' as const,
        detected_structure: mockStructure,
        top_5_improvements: [
          {
            rank: 1,
            priority: 'Critical' as const,
            title: 'Add standard TECHNICAL SKILLS header',
            problem_found: 'Skills section not detected.',
            why_it_matters: 'ATS cannot find skills',
            action_type: 'immediate_fix' as const,
            how_to_fix: 'Add header',
            location: 'Skills',
          },
          {
            rank: 2,
            priority: 'Critical' as const,
            title: 'Education details missing',
            problem_found: 'Education credentials were not detected.',
            why_it_matters: 'Recruiters need education',
            action_type: 'immediate_fix' as const,
            how_to_fix: 'Add education',
            location: 'Education',
          },
        ],
        critical_issues: [
          {
            type: 'missing_essential_info' as const,
            title: 'Skills Section Not Detected',
            problem_found: 'No dedicated skills found.',
            why_it_matters: 'Crucial for ATS',
            how_to_fix: 'Add section',
            location: 'Skills',
          },
          {
            type: 'missing_essential_info' as const,
            title: 'Education Details Missing',
            problem_found: 'No education found.',
            why_it_matters: 'Crucial for evaluation',
            how_to_fix: 'Add education',
            location: 'Education',
          },
        ],
        content_impact_improvements: [],
        ats_improvements: {
          parseability_status: 'Good' as const,
          ats_score_estimate: 80,
          recruiter_readability_balance: 'Balanced',
          formatting_risks: [],
          section_header_feedback: [],
          keyword_strategy: '',
        },
        role_specific_improvements: {
          target_role: '',
          job_description_provided: false,
          role_analysis_limited_note: '',
          strong_matches: [],
          missing_important_keywords: [],
          unproven_skills: [],
          experiences_to_emphasize: [],
          unevidenced_claims_to_avoid: [],
        },
        section_optimization: [],
        candidate_information_needed: [],
      };

      const cleaned = runConsistencyCheck(inconsistentReview, mockStructure, true);

      assert.equal(cleaned.critical_issues.length, 0);
      assert.equal(cleaned.top_5_improvements.length, 0);
    });
  });

  describe('5. Low-Confidence Parser Resilience', () => {
    it('protects resume scores and prevents critical missing section defects when confidence is LOW', () => {
      // Degraded layout input
      const messyText = `
        Alex Mercer
        alex@test.com
        B.Tech CSE 2024 IIT Roorkee
        Skills: Python, TypeScript, Docker
        Projects: Built web app with 500+ users
      `;

      const review = reviewResume(messyText);

      // Even if parser had low confidence or uncertain sections, score must not be tanked below reasonable fresher baseline
      assert.ok(review.overall >= 70, `Expected overall score >= 70, got ${review.overall}`);
      // Critical issues must not contain parser uncertainty defects
      const criticalTitles = review.critical_issues.map((i) => i.title.toLowerCase());
      assert.ok(!criticalTitles.some((t) => t.includes('uncertainty') || t.includes('parsing failure')));
    });
  });

  describe('6. Comprehensive Metric Recognition', () => {
    it('recognizes diverse metric patterns: percentages, ranks, scale, counts, durations, latency', () => {
      const resumeWithMetrics = `
        - Optimized database query throughput by 45%, reducing response time from 350ms to 40ms
        - Achieved All India Rank (AIR) 85 out of 150,000+ candidates
        - Led a cross-functional team of 6 engineers over a 9-month development cycle
        - Developed image classifier achieving 98.4% validation accuracy on 50,000 images
        - Solved 750+ algorithmic problems across LeetCode and Codeforces
        - Managed an annual cloud infrastructure budget of $120,000 with 99.95% uptime
      `;

      const { hasMetrics, metricCount, metricList } = detectResumeMetrics(resumeWithMetrics);

      assert.ok(hasMetrics);
      assert.ok(metricCount >= 6, `Expected at least 6 metrics, found ${metricCount}`);
      assert.ok(metricList.some((m) => m.includes('%')));
      assert.ok(metricList.some((m) => /(?:AIR|All India Rank)[^\d]*85/i.test(m)));
      assert.ok(metricList.some((m) => /team\s+of\s+6/i.test(m)));
      assert.ok(metricList.some((m) => /\$120,000/i.test(m)));
      assert.ok(metricList.some((m) => /750\+.*problems/i.test(m)));
    });

    it('identifies specific bullets lacking evidence instead of blanket claims', () => {
      const resume = `
        WORK EXPERIENCE
        Software Engineer
        - Worked on frontend features and bug fixes
        - Assisted senior developers with testing
        - Optimized database queries resulting in 30% faster page loads
      `;

      const review = reviewResume(resume);

      // Should identify specific weak bullets rather than claiming the entire resume has zero metrics
      const contentImprovements = review.content_impact_improvements;
      assert.ok(contentImprovements.length > 0);
      assert.ok(
        contentImprovements.some((c) =>
          c.before_after_examples?.some(
            (ex) =>
              ex.metric_guidance &&
              ex.metric_guidance.includes('Consider adding a verified metric if you have evidence')
          )
        )
      );
    });
  });

  describe('7. Recommendation Deduplication & Candidate Stage Text', () => {
    it('merges duplicate recommendations and ensures candidate stage text is distinct', () => {
      const resume = `
        Jane Doe
        jane@example.com
        EDUCATION
        B.Tech Computer Science, 2024
        SKILLS
        Python, JavaScript, SQL
        EXPERIENCE
        Intern at Tech Co
        - Worked on backend services
      `;

      const review = reviewResume(resume);

      // Check top_5_improvements deduplication
      const titles = review.top_5_improvements.map((t) => t.title.toLowerCase());
      const uniqueTitles = new Set(titles);
      assert.equal(titles.length, uniqueTitles.size);

      // Check executive summary is distinct from career stage context
      assert.notEqual(review.executive_summary, review.career_stage_context);
    });
  });

  describe('8. PDF / Document Text Extraction', () => {
    it('extracts text from plain text document base64', () => {
      const text = 'EDUCATION\nB.Tech Computer Science\nSKILLS\nPython, Docker';
      const base64 = Buffer.from(text).toString('base64');

      const extracted = extractTextFromDocument({
        base64,
        mimeType: 'text/plain',
        name: 'resume.txt',
      });

      assert.ok(extracted.includes('EDUCATION'));
      assert.ok(extracted.includes('Python'));
    });
  });

  describe('9. Degree Variations & Technical Metrics', () => {
    it('detects multiple degree variations (B.E., M.Tech, Ph.D., MCA, MBA) via content heuristics', () => {
      const degrees = [
        'Bachelor of Engineering (B.E.) in Information Science, VTU 2023',
        'M.Tech in Artificial Intelligence, IIT Madras | CGPA: 9.5',
        'Ph.D. in Computer Science, Carnegie Mellon University (2022)',
        'Master of Computer Applications (MCA), NIT Trichy, 2024',
      ];

      for (const d of degrees) {
        const structure = parseResumeStructure(d);
        assert.equal(
          structure.education.state,
          'DETECTED',
          `Expected ${d} to be detected as Education`
        );
      }
    });

    it('detects technical latency, throughput, and speedup metrics', () => {
      const perfText = `
        - Reduced API response latency from 450ms to 25ms
        - Scaled streaming architecture to handle 25,000 QPS with 3x speedup
        - Decreased AWS S3 memory footprint by 40GB
      `;

      const { hasMetrics, metricList } = detectResumeMetrics(perfText);
      assert.ok(hasMetrics);
      assert.ok(metricList.some((m) => /450ms|25ms/i.test(m)));
      assert.ok(metricList.some((m) => /25,000\s*QPS/i.test(m)));
      assert.ok(metricList.some((m) => /3x\s*speedup/i.test(m)));
      assert.ok(metricList.some((m) => /40GB/i.test(m)));
    });
  });
});
