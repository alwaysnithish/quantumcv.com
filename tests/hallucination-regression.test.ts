import test from 'node:test';
import assert from 'node:assert';
import {
  parseResumeStructure,
  reviewResume,
} from '../src/lib/resume-review.ts';
import {
  extractLosslessMetrics,
  buildEvidenceMap,
  validateAndGroundAnalysis,
} from '../src/lib/evidence-grounding.ts';

// ── Generic Test Fixtures ──

const FIXTURE_UNCONNECTED_SKILLS = `
Candidate Name
candidate@example.com | +1 555-0123 | New York, NY

TECHNICAL SKILLS
Languages: Python, C++, Java, JavaScript
Tools: Docker, Kubernetes, Git, Linux

EDUCATION
Bachelor of Science in Computer Science | City University | 2020 - 2024
GPA: 3.7/4.0

PROJECTS
Task Manager Web Application | JavaScript, HTML5, CSS3 | 2023
• Developed responsive task tracking frontend interface.
• Implemented local storage caching for offline task persistence.
`;

const FIXTURE_INDIAN_CURRENCY_PROJECT = `
Priya Sharma
priya@example.com | +91 9876543210 | Bengaluru, India

EDUCATION
B.Tech in Computer Science | NIT Karnataka | 2020 - 2024
CPI: 9.2/10

TECHNICAL SKILLS
Languages: Python, TypeScript, SQL
Frameworks: React, Next.js, FastAPI

PROJECTS
Automated Code Evaluator | Python, FastAPI | 2023 - 2024
• Won Rs. 3,00,000 innovation grant for building real-time code execution sandbox.
• Achieved 90% CNN accuracy on automated code pattern classification.
• Handled 15,000+ QPS with sub-10ms response time.

EXPERIENCE
Software Intern | CloudTech Labs | Jan 2024 - Jun 2024
• Developed REST APIs handling 50k requests/day with 99.9% uptime.
`;

const FIXTURE_EXPLICIT_INTEGRATION_PROJECT = `
Alex Mercer
alex@example.com | +1 555-4321 | Seattle, WA

EDUCATION
B.S. in Computer Engineering | University of Washington | 2019 - 2023

TECHNICAL SKILLS
Languages: Python, C++, Go
Platforms: Docker, Linux

PROJECTS
High-Performance Algorithmic Trading Bridge | Python, C++ | 2023
• Integrated Python data pipeline with C++ low-latency order execution engine.
• Reduced communication latency to 25ms between Python wrapper and C++ native module.
`;

const FIXTURE_SKILL_WITHOUT_PROJECT = `
David Miller
david@example.com | +1 555-8888 | Austin, TX

EDUCATION
Bachelor of Science in Mathematics | State University | 2019 - 2023

TECHNICAL SKILLS
Languages: Python, C++, Rust, Go
Databases: PostgreSQL, Redis

WORK EXPERIENCE
Database Administrator | DataCorp | 2023 - Present
• Maintained PostgreSQL databases and optimized indexing strategies.
• Managed daily backup routines and automated disaster recovery failover.
`;

const FIXTURE_DOCKER_K8S_WITHOUT_PRODUCTION = `
Elena Rostova
elena@example.com | +1 555-9999 | Chicago, IL

EDUCATION
B.S. in Computer Science | Midwest University | 2020 - 2024

TECHNICAL SKILLS
Languages: Java, Python, SQL
Infrastructure: Docker, Kubernetes, AWS

PROJECTS
Campus Event Booking System | Java, Spring Boot | 2023
• Built event reservation system with MySQL database.
• Packaged backend services into Docker containers for local development.
`;

// ── Hallucination Regression Tests ──

test('1. Unconnected skills (Python, C++) must NOT produce multi-tech integration claims or questions', () => {
  const review = reviewResume(FIXTURE_UNCONNECTED_SKILLS);

  // 1. Recruiter strengths must not assert an unevidenced integration between Python and C++
  const allStrengths = [
    ...(review.strengths || []),
    ...(review.recruiter_review?.strengths || []),
  ].join(' ');

  assert.strictEqual(
    /integration\s+(?:between|of|with)\s+Python\s+and\s+C\+\+|Python\/C\+\+\s+integration/i.test(allStrengths),
    false,
    `Strengths must not claim Python/C++ integration when only listed as skills: "${allStrengths}"`
  );

  // 2. Recruiter questions must not ask how the candidate integrated Python and C++
  const allQuestions = (review.recruiter_review?.likely_recruiter_questions || []).join(' ');

  assert.strictEqual(
    /integrate\s+Python\s+and\s+C\+\+|integration\s+between\s+Python\s+and\s+C\+\+|Python\/C\+\+/i.test(allQuestions),
    false,
    `Recruiter questions must not ask about Python/C++ integration without project evidence: "${allQuestions}"`
  );

  // 3. Evidence map explicit tech relationships must be empty for skills list
  const evidenceMap = review.evidence_map;
  assert.ok(evidenceMap);
  const hasPythonCppPair = evidenceMap.explicit_tech_relationships.some(
    (p) =>
      (p.tech1.toLowerCase() === 'python' && p.tech2.toLowerCase() === 'c++') ||
      (p.tech1.toLowerCase() === 'c++' && p.tech2.toLowerCase() === 'python')
  );
  assert.strictEqual(
    hasPythonCppPair,
    false,
    'Skills list alone must not create an explicit tech relationship'
  );
});

test('2. Monetary value "Rs. 3,00,000" must be extracted losslessly and NEVER truncated to "Rs.3" or "Rs. 3"', () => {
  const metrics = extractLosslessMetrics(FIXTURE_INDIAN_CURRENCY_PROJECT);

  // Must find "Rs. 3,00,000"
  const currencyMetric = metrics.find((m) => m.category === 'currency');
  assert.ok(currencyMetric, 'Expected currency metric to be found');
  assert.strictEqual(currencyMetric.normalized_value, 'Rs. 3,00,000');
  assert.strictEqual(currencyMetric.is_valid, true);
  assert.strictEqual(currencyMetric.confidence, 'high');

  // Must NEVER extract "Rs.3", "Rs. 3", or "Rs.300"
  const truncatedValues = ['Rs.3', 'Rs. 3', 'Rs.300', 'Rs. 300', '3', 'Rs.'];
  for (const t of truncatedValues) {
    assert.strictEqual(
      metrics.some((m) => m.normalized_value === t || m.original_value === t),
      false,
      `Lossless metric extractor produced truncated value "${t}"`
    );
  }

  // Review analysis must retain full "Rs. 3,00,000" in strengths and questions
  const review = reviewResume(FIXTURE_INDIAN_CURRENCY_PROJECT);
  const reviewText = JSON.stringify(review);
  assert.ok(
    reviewText.includes('Rs. 3,00,000') || reviewText.includes('3,00,000'),
    'Full monetary amount must be preserved in analysis'
  );
  assert.strictEqual(
    /\bRs\.\s*3\b(?!\s*,\s*00\s*,\s*000)/.test(reviewText),
    false,
    'Review must not contain truncated "Rs. 3"'
  );
});

test('3. Corrupted or truncated metric is rejected and NEVER used in candidate claims or recruiter questions', () => {
  // Test validation layer when given a synthetic hallucinated/corrupted report
  const evidenceMap = buildEvidenceMap(FIXTURE_INDIAN_CURRENCY_PROJECT);

  const corruptedReport = {
    strengths: [
      'Validated the Rs.3 result in code evaluation.',
      'Strong Python and C++ integration experience.',
    ],
    recruiter_review: {
      first_impression: 'Strong candidate profile.',
      strengths: ['Validated the Rs.3 result in code evaluation.'],
      concerns: [],
      interview_probability: 'Strong',
      likely_recruiter_questions: [
        'How did you validate the Rs.3 result on the project?',
        'How did you integrate Python and C++ in your backend?',
      ],
    },
  };

  const grounded = validateAndGroundAnalysis(corruptedReport, evidenceMap);

  // Corrupted Rs.3 must be repaired or replaced with lossless Rs. 3,00,000
  for (const q of grounded.recruiter_review?.likely_recruiter_questions || []) {
    assert.strictEqual(
      /\bRs\.\s*3\b(?!\s*,\s*00)/i.test(q),
      false,
      `Corrupted metric was not filtered from question: "${q}"`
    );
    assert.strictEqual(
      /integrate\s+Python\s+and\s+C\+\+/i.test(q),
      false,
      `Unsupported integration was not filtered from question: "${q}"`
    );
  }

  for (const s of grounded.strengths || []) {
    assert.strictEqual(
      /\bRs\.\s*3\b(?!\s*,\s*00)/i.test(s),
      false,
      `Corrupted metric was not filtered from strength: "${s}"`
    );
  }
});

test('4. Skill in Technical Skills without project application must NOT claim "Built applications" or project experience', () => {
  const review = reviewResume(FIXTURE_SKILL_WITHOUT_PROJECT);

  // Candidate has Python in skills, but ONLY worked on PostgreSQL in experience, no Python project
  const allStrengths = [
    ...(review.strengths || []),
    ...(review.recruiter_review?.strengths || []),
  ].join(' ');

  assert.strictEqual(
    /built\s+Python\s+applications?|experienced\s+in\s+Python\s+development/i.test(allStrengths),
    false,
    `Must not claim "Built Python applications" when Python only in skills: "${allStrengths}"`
  );

  // Grounding should describe Python as part of skills inventory
  const evidenceMap = review.evidence_map;
  assert.ok(evidenceMap);
  const pythonSkill = evidenceMap.skills.find((s) => s.name.toLowerCase() === 'python');
  assert.ok(pythonSkill);
  assert.strictEqual(pythonSkill.evidence_type, 'skill_inventory');
});

test('5. Docker and Kubernetes in Skills without production statement must NOT claim "Managed production Kubernetes infrastructure"', () => {
  const review = reviewResume(FIXTURE_DOCKER_K8S_WITHOUT_PRODUCTION);

  const allStrengths = [
    ...(review.strengths || []),
    ...(review.recruiter_review?.strengths || []),
  ].join(' ');

  assert.strictEqual(
    /managed\s+production\s+kubernetes|production\s+kubernetes\s+infrastructure|production\s+deployment/i.test(allStrengths),
    false,
    `Must not claim "Managed production Kubernetes" without production evidence: "${allStrengths}"`
  );

  // Recruiter questions must not ask about production deployment
  const allQuestions = (review.recruiter_review?.likely_recruiter_questions || []).join(' ');
  assert.strictEqual(
    /production\s+kubernetes|production\s+deployment\s+infrastructure/i.test(allQuestions),
    false,
    `Questions must not assert production deployment without evidence: "${allQuestions}"`
  );
});

test('6. Explicit technology integration in a project IS recognized and evidenced', () => {
  const review = reviewResume(FIXTURE_EXPLICIT_INTEGRATION_PROJECT);

  // In this fixture, Python and C++ ARE explicitly connected in the same project
  const evidenceMap = review.evidence_map;
  assert.ok(evidenceMap);

  const hasPythonCppRelationship = evidenceMap.explicit_tech_relationships.some(
    (p) =>
      (p.tech1.toLowerCase() === 'python' && p.tech2.toLowerCase() === 'c++') ||
      (p.tech1.toLowerCase() === 'c++' && p.tech2.toLowerCase() === 'python')
  );

  assert.strictEqual(
    hasPythonCppRelationship,
    true,
    'Explicit project integration between Python and C++ must be evidenced'
  );
});

test('7. Recruiter screening questions must reference explicit resume evidence and store source citations', () => {
  const review = reviewResume(FIXTURE_INDIAN_CURRENCY_PROJECT);

  assert.ok(review.recruiter_review);
  assert.ok(review.recruiter_review.likely_recruiter_questions.length > 0);

  const groundedQuestions = review.recruiter_review.grounded_questions;
  assert.ok(groundedQuestions && groundedQuestions.length > 0);

  for (const q of groundedQuestions) {
    assert.ok(q.question.length > 10, 'Question must be substantial');
    assert.ok(q.source_section.length > 0, 'source_section must be present');
    assert.ok(q.source_text.length > 0, 'source_text must be present');
    assert.strictEqual(q.evidence_type, 'explicit', 'evidence_type must be explicit');
    assert.ok(q.confidence >= 0.8, 'confidence must be high');
  }

  // Verify questions reference real candidate claims (e.g. 90% accuracy, REST APIs, or Automated Code Evaluator)
  const allQuestionsJoined = groundedQuestions.map((g) => g.question).join(' ');
  assert.ok(
    /Automated Code Evaluator|REST API|90%|FastAPI|CPI|NIT/i.test(allQuestionsJoined),
    `Questions must reference explicit evidence: ${allQuestionsJoined}`
  );
});

test('8. Potential recruiter pauses are based only on actual findings and never invented', () => {
  const cleanResume = `
Jane Doe
jane@example.com | +1 555-0101 | San Francisco, CA

EDUCATION
B.S. in Computer Science | Stanford University | 2020 - 2024
GPA: 3.9/4.0

TECHNICAL SKILLS
Languages: Python, TypeScript, Go
Frameworks: React, Next.js, FastAPI

WORK EXPERIENCE
Software Engineer Intern | Stripe | May 2023 - Aug 2023
• Built real-time payment webhook router in Go handling 10,000+ events/sec with sub-5ms latency.
• Engineered unit testing suite with 95% code coverage.
`;

  const review = reviewResume(cleanResume);
  assert.ok(review.recruiter_review);

  // Resume is strong and clean with active verbs and metrics
  for (const concern of review.recruiter_review.concerns) {
    assert.ok(concern.length > 0);
    assert.notStrictEqual(concern, '-');
  }
});

test('9. Section detection preserves HIGH confidence for Education, Experience, Projects, and Skills', () => {
  const structure = parseResumeStructure(FIXTURE_INDIAN_CURRENCY_PROJECT);

  assert.strictEqual(structure.education.state, 'DETECTED');
  assert.strictEqual(structure.education.confidence, 'high');

  assert.strictEqual(structure.skills.state, 'DETECTED');
  assert.strictEqual(structure.skills.confidence, 'high');

  assert.strictEqual(structure.projects.state, 'DETECTED');
  assert.strictEqual(structure.projects.confidence, 'high');

  assert.strictEqual(structure.experience.state, 'DETECTED');
  assert.strictEqual(structure.experience.confidence, 'high');
});
