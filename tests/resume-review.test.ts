import test from 'node:test';
import assert from 'node:assert';
import {
  parseResumeStructure,
  detectResumeMetrics,
  reviewResume,
} from '../src/lib/resume-review.ts';

// ── Generic Resume Fixtures (Diverse & Generic) ──

const FIXTURE_STANDARD_WORK_EXPERIENCE = `
Alex Morgan
alex.morgan@email.com | +1 555-0199 | San Francisco, CA | linkedin.com/in/alexmorgan | github.com/alexmorgan

WORK EXPERIENCE
Senior Backend Engineer | Acme Technologies | Jan 2022 - Present
• Architected high-throughput microservices using Go and PostgreSQL handling 15,000+ QPS with sub-100ms latency.
• Streamlined deployment pipelines with Docker and Kubernetes, reducing release cycle time by 40%.
• Mentored a team of 5 junior engineers and conducted weekly design reviews.

Software Engineer | Globex Corporation | Jun 2019 - Dec 2021
• Built and maintained RESTful APIs using Node.js and TypeScript serving 500,000+ active users.
• Optimized database queries in MongoDB, improving search performance by 3.5x.

TECHNICAL SKILLS
Languages: Go, TypeScript, JavaScript, Python, SQL
Technologies: Node.js, React, Docker, Kubernetes, AWS, PostgreSQL, MongoDB, Redis, GraphQL
Tools: Git, GitHub, CI/CD, Linux

EDUCATION
Bachelor of Science in Computer Science | Stanford University | 2015 - 2019
• GPA: 3.8/4.0 | Dean's Honor List

ACHIEVEMENTS
• 1st place in ACM Regional Collegiate Hackathon among 120 teams
• Top 1% ranking on LeetCode with 800+ solved algorithmic problems
`;

const FIXTURE_PROFESSIONAL_EXP_INDIAN_CURRENCY = `
Priya Sharma
priya.sharma@example.com | +91 9876543210 | Bengaluru, India | github.com/priyasharma

PROFESSIONAL EXPERIENCE
Software Development Engineer | CloudNative Pvt Ltd | Jul 2022 - Present
• Designed scalable distributed storage system with Python and AWS, cutting infrastructure costs by 25%.
• Spearheaded migration of legacy services to Next.js and Tailwind CSS with 99.9% uptime.
• Secured innovation grant worth Rs. 3,00,000 for building automated code evaluation engine.

Software Engineering Intern | TechMatrix Labs | Jan 2022 - Jun 2022
• Developed real-time telemetry dashboard using React and WebSocket with ₹50,000 performance award.
• Implemented automated unit test suite increasing code coverage from 60% to 90%.

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, C++, Java
Frameworks: React, Next.js, Django, FastAPI
Databases & Cloud: PostgreSQL, Redis, Docker, AWS, Git, GitHub

EDUCATION
Bachelor of Technology in Information Technology | National Institute of Technology | 2018 - 2022
• CPI: 9.42/10 | Distinction

POSITIONS OF RESPONSIBILITY
Technical Head | University Coding Club | 2020 - 2022
• Organized national coding competition with 2,500+ participants and managed 10 student coordinators.

AWARDS & ACHIEVEMENTS
• All India Rank (AIR) 85 in National Coding Olympiad
• Winner of Smart India Hackathon with cash prize of ₹1,00,000
`;

const FIXTURE_INTERNSHIP_STUDENT = `
Rohan Gupta
rohan.gupta@edu.in | +91 9123456780 | Delhi, India | github.com/rohangupta

EDUCATION
Bachelor of Technology in Computer Science | Indian Institute of Technology | 2021 - 2025
• CGPA: 9.1/10 | Expected Graduation: May 2025
• Relevant Coursework: Data Structures & Algorithms, Operating Systems, Database Management Systems

INTERNSHIP EXPERIENCE
Backend Engineering Intern | InnovateX | May 2024 - Jul 2024
• Built authentication microservice using Go and PostgreSQL with JWT validation.
• Automated CI/CD deployment pipelines using GitHub Actions and Docker.

PROJECTS
Distributed Cache System | Go, Redis, Docker | Jan 2024 - Mar 2024
• Implemented distributed in-memory cache supporting LRU eviction and consensus replication.
• Achieved 10,000+ operations per second with sub-5ms latency across 3 nodes.

AI Code Review Bot | Python, PyTorch, FastAPI | Sep 2023 - Nov 2023
• Developed GitHub Action bot providing automated static code analysis with 92% precision.

TECHNICAL SKILLS
Languages: C++, Python, Go, JavaScript, SQL
Tools & Frameworks: Docker, PostgreSQL, Redis, Git, GitHub, Linux, FastAPI

POSITIONS OF RESPONSIBILITY
Lead Coordinator | HackIIT Hackathon | 2023 - 2024
• Led a team of 15 members to execute a 36-hour hackathon with 800+ participants.

ACHIEVEMENTS
• AIR 142 in JEE Advanced among 150,000+ candidates
• Finalist in Global ACM ICPC Regional Contest
`;

const FIXTURE_EMPLOYMENT_WORK_HISTORY = `
Sarah Jenkins
sarah.j@email.com | +44 7700 900077 | London, UK

EMPLOYMENT
Lead Frontend Architect | Fintech Solutions | 2020 - Present
• Spearheaded frontend modernization to Next.js and TypeScript, reducing initial page load time by 50%.
• Managed team of 8 engineers and conducted bi-weekly agile planning.

WORK HISTORY
Frontend Developer | WebCorp UK | 2017 - 2020
• Developed customer portal using React and Redux supporting 100,000+ monthly active users.
• Improved accessibility audit score to 98% compliance.

SKILLS & TECHNOLOGIES
Core: JavaScript, TypeScript, React, Next.js, HTML5, CSS3
Backend & Tools: Node.js, GraphQL, Docker, AWS, Git, CI/CD

EDUCATION
BSc in Software Engineering | University of Manchester | 2014 - 2017
• First Class Honours

CERTIFICATIONS
• AWS Certified Solutions Architect - Associate
`;

const FIXTURE_WEAK_BULLETS_NO_JD = `
John Doe
john.doe@email.com | +1 555-0100 | Seattle, WA

EXPERIENCE
Software Engineer | Alpha Corp | 2022 - Present
• Responsible for working on the backend services.
• Worked with team to build customer dashboard.
• Helped with testing and documentation.

TECHNICAL SKILLS
Languages: javascript, typescript, python
Technologies: reactjs, nodejs, postgresql, aws

EDUCATION
B.S. in Computer Science | University of Washington | 2018 - 2022
`;

// ── Tests ──

test('1. Experience Section Detection - WORK EXPERIENCE', () => {
  const structure = parseResumeStructure(FIXTURE_STANDARD_WORK_EXPERIENCE);
  assert.strictEqual(structure.experience.state, 'DETECTED');
  assert.strictEqual(structure.experience.detected, true);
  assert.strictEqual(structure.experience.confidence, 'high');
});

test('1. Experience Section Detection - PROFESSIONAL EXPERIENCE', () => {
  const structure = parseResumeStructure(FIXTURE_PROFESSIONAL_EXP_INDIAN_CURRENCY);
  assert.strictEqual(structure.experience.state, 'DETECTED');
  assert.strictEqual(structure.experience.detected, true);
});

test('1. Experience Section Detection - INTERNSHIP EXPERIENCE', () => {
  const structure = parseResumeStructure(FIXTURE_INTERNSHIP_STUDENT);
  assert.strictEqual(structure.experience.state, 'DETECTED');
  assert.strictEqual(structure.experience.detected, true);
});

test('1. Experience Section Detection - EMPLOYMENT & WORK HISTORY', () => {
  const structure = parseResumeStructure(FIXTURE_EMPLOYMENT_WORK_HISTORY);
  assert.strictEqual(structure.experience.state, 'DETECTED');
  assert.strictEqual(structure.experience.detected, true);
});

test('1. Experience Section Detection - Common variations & spaced headers', () => {
  const variations = [
    'EXPERIENCE',
    'WORK EXPERIENCE',
    'PROFESSIONAL EXPERIENCE',
    'EMPLOYMENT',
    'INTERNSHIP EXPERIENCE',
    'WORK HISTORY',
    'EMPLOYMENT HISTORY',
    'RELEVANT EXPERIENCE',
    'PRACTICAL EXPERIENCE',
    '1. WORK EXPERIENCE',
    '# PROFESSIONAL EXPERIENCE',
    'W O R K   E X P E R I E N C E',
    'WORK EXPERIENCE (2020 - 2024)',
    'WORK EXPERIENCE | Tech',
  ];

  for (const v of variations) {
    const text = `${v}\nSoftware Engineer | Acme Corp | 2021 - Present\n• Built high throughput backend systems.\n\nEDUCATION\nBS in CS | 2020\n\nSKILLS\nPython, Go`;
    const structure = parseResumeStructure(text);
    assert.strictEqual(
      structure.experience.state,
      'DETECTED',
      `Failed to detect experience heading variation: "${v}"`
    );
  }
});

test('1. Section Detection - EDUCATION, SKILLS, PROJECTS, ACHIEVEMENTS, LEADERSHIP', () => {
  const structure = parseResumeStructure(FIXTURE_INTERNSHIP_STUDENT);
  assert.strictEqual(structure.education.state, 'DETECTED');
  assert.strictEqual(structure.skills.state, 'DETECTED');
  assert.strictEqual(structure.projects.state, 'DETECTED');
  assert.strictEqual(structure.leadership.state, 'DETECTED');
  assert.strictEqual(structure.achievements.state, 'DETECTED');
});

test('2 & 5 & 6. General Resume Analysis Works Completely Without a JD', () => {
  const review = reviewResume(FIXTURE_STANDARD_WORK_EXPERIENCE);

  // Score must be solid for strong resume without JD
  assert.ok(review.overall >= 75, `Expected score >= 75, got ${review.overall}`);
  assert.strictEqual(review.role_specific_improvements.job_description_provided, false);
  assert.strictEqual(
    review.role_specific_improvements.role_analysis_limited_note,
    'Role-specific analysis is unavailable without a target role or job description.'
  );

  // Top 5 improvements must NOT contain "Provide a target JD"
  for (const imp of review.top_5_improvements) {
    assert.ok(
      !/job\s*description|target\s*role|tailored\s*matching/i.test(imp.title),
      `Top improvements must not contain JD prompts as resume defects: "${imp.title}"`
    );
  }

  // Critical issues must not report missing experience
  assert.strictEqual(
    review.critical_issues.some((c) => /experience/i.test(c.title)),
    false
  );
});

test('3. Metric Extraction - Indian & International Currencies & No Truncation', () => {
  const sampleText = `
    Won Rs. 3,00,000 innovation grant.
    Received ₹3,00,000 seed funding.
    Awarded ₹50,000 cash prize.
    Managed $50,000 infrastructure budget.
    Generated €100,000 in revenue.
    Raised £75,000 in pre-seed.
    Improved throughput by 50% with 90% test coverage.
    Handled 800+ participants and 15,000+ QPS with 3.5x speedup.
    Ranked Top 10% on platform with AIR 142 in national exam.
    Achieved 9.42/10 CPI and 3.8/4.0 GPA.
  `;

  const { hasMetrics, metricList } = detectResumeMetrics(sampleText);
  assert.strictEqual(hasMetrics, true);

  // Verify NO corrupted strings ending with commas (e.g. "Rs.3,00,")
  for (const m of metricList) {
    assert.ok(!/,\s*$/.test(m), `Metric contains dangling comma: "${m}"`);
    assert.ok(!/\b\d+,$/.test(m), `Metric ends with incomplete comma: "${m}"`);
  }

  // Verify key metrics were extracted
  const allJoined = metricList.join(' ');
  assert.ok(allJoined.includes('3,00,000'), `Expected 3,00,000 in metrics list: ${allJoined}`);
  assert.ok(allJoined.includes('50%') || allJoined.includes('90%'), `Expected percentages in metrics: ${allJoined}`);
  assert.ok(allJoined.includes('800+') || allJoined.includes('15,000+'), `Expected scale metrics: ${allJoined}`);
  assert.ok(allJoined.includes('3.5x'), `Expected multiplier 3.5x in metrics: ${allJoined}`);
  assert.ok(allJoined.includes('Top 10%') || allJoined.includes('AIR 142'), `Expected ranking in metrics: ${allJoined}`);
});

test('4. Bullet-Specific Metric Analysis - Acknowledges existing metrics without blanket deficit', () => {
  const review = reviewResume(FIXTURE_STANDARD_WORK_EXPERIENCE);

  // Resume has metrics (15,000+ QPS, 500,000+, 3.5x, 3.8/4.0 GPA, 1st place, 800+)
  assert.ok(
    review.strengths.some((s) => /quantifiable metrics|metrics and outcomes/i.test(s)),
    'Existing metrics must be recognized in strengths'
  );

  // Must not claim the entire resume lacks metrics
  assert.strictEqual(
    review.critical_issues.some((c) => /lacks\s+quantification|missing\s+metrics/i.test(c.title)),
    false
  );
  assert.strictEqual(
    review.top_5_improvements.some((t) => /bullets\s+currently\s+lack\s+measurable\s+scale/i.test(t.problem_found)),
    false
  );
});

test('7. Improved Recommendation Evidence - Includes problem, why, and action', () => {
  const review = reviewResume(FIXTURE_WEAK_BULLETS_NO_JD);

  // Weak bullets fixture has passive verbs and terminology issues
  assert.ok(review.top_5_improvements.length > 0);
  for (const imp of review.top_5_improvements) {
    assert.ok(imp.problem_found.length > 5, 'problem_found must be descriptive');
    assert.ok(imp.why_it_matters.length > 5, 'why_it_matters must explain impact');
    assert.ok(imp.how_to_fix.length > 5, 'how_to_fix must contain actionable instruction');
    assert.ok(imp.location.length > 0, 'location must be specified');
  }
});

test('8 & 9. Parser Confidence Separation & Score Consistency', () => {
  // Low confidence scenario with minimal text
  const minimalText = 'John Doe\nSoftware Developer\nPython, Java';
  const lowConfReview = reviewResume(minimalText);

  assert.strictEqual(lowConfReview.analysis_confidence, 'low');
  // Must NOT generate missing-section blockers when confidence is low
  assert.strictEqual(
    lowConfReview.critical_issues.some((c) => /missing_essential_info|major_ats_problem/i.test(c.type) && /missing/i.test(c.title)),
    false
  );
  // Scores protected against parser uncertainty
  assert.ok(lowConfReview.structure >= 80, `Structure score should be >= 80, got ${lowConfReview.structure}`);
});

test('10. Duplicate Output Prevention', () => {
  const review = reviewResume(FIXTURE_STANDARD_WORK_EXPERIENCE);

  // Executive summary should not exactly repeat career_stage_context
  assert.notStrictEqual(review.executive_summary, review.career_stage_context);

  // Top improvements should not contain duplicates
  const titles = review.top_5_improvements.map((t) => t.title);
  const uniqueTitles = new Set(titles);
  assert.strictEqual(titles.length, uniqueTitles.size, 'Top improvements contain duplicates');
});

test('11 & 12. Recruiter 6-Second Glance & Recruiter Questions', () => {
  const review = reviewResume(FIXTURE_INTERNSHIP_STUDENT);

  assert.ok(review.recruiter_review);
  assert.ok(review.recruiter_review.strengths.length > 0);
  assert.ok(review.recruiter_review.concerns.length > 0);

  // Concerns should never be empty or "-"
  for (const c of review.recruiter_review.concerns) {
    assert.ok(c && c.trim() !== '-' && c.trim().length > 0, `Invalid concern: "${c}"`);
  }

  // Recruiter questions must reference candidate content
  assert.ok(review.recruiter_review.likely_recruiter_questions.length > 0);
  const questionsJoined = review.recruiter_review.likely_recruiter_questions.join(' ');
  assert.ok(
    /Go|Python|Redis|PyTorch|FastAPI|IIT|JEE|Hackathon|Cache/i.test(questionsJoined),
    `Questions must reference candidate context: ${questionsJoined}`
  );
});

test('13. JD-Present Role Analysis', () => {
  const jd = 'We are looking for a Senior Backend Engineer proficient in Go, Kubernetes, PostgreSQL, and Redis.';
  const review = reviewResume(FIXTURE_STANDARD_WORK_EXPERIENCE, 'Senior Backend Engineer', jd);

  assert.strictEqual(review.role_specific_improvements.job_description_provided, true);
  assert.ok(review.role_specific_improvements.strong_matches.length > 0);
  assert.ok(review.role_specific_improvements.strong_matches.includes('go') || review.role_specific_improvements.strong_matches.includes('kubernetes'));
});
