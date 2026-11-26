import google.generativeai as genai
from django.conf import settings
import json, re, logging

logger = logging.getLogger(__name__)

MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
]


def _get_model():
    genai.configure(api_key=settings.GEMINI_API_KEY)
    for model_name in MODELS:
        try:
            return genai.GenerativeModel(model_name)
        except Exception:
            continue
    raise RuntimeError("No Gemini model available.")


def _detect_profile(raw_data: str) -> dict:
    """Detect career stage and profile type from raw data."""
    raw_lower = raw_data.lower()

    is_fresher = any(w in raw_lower for w in [
        'fresher', 'final year', 'b.tech', 'btech', 'b.e', 'be student',
        'cgpa', 'gpa', '1st year', '2nd year', '3rd year', '4th year',
        'pursuing', 'currently studying', 'expected graduation'
    ])

    has_experience = any(w in raw_lower for w in [
        'years of experience', 'yrs experience', 'worked at', 'employed',
        'full time', 'permanent role', 'senior', 'lead', 'manager', 'architect'
    ])

    has_internship = any(w in raw_lower for w in [
        'intern', 'internship', 'trainee', 'apprentice'
    ])

    has_projects = any(w in raw_lower for w in [
        'project', 'built', 'developed', 'created', 'github', 'deployed'
    ])

    has_cgpa = bool(re.search(r'cgpa\s*[:\-]?\s*[0-9.]+', raw_lower) or
                    re.search(r'gpa\s*[:\-]?\s*[0-9.]+', raw_lower))

    years_exp = 0
    exp_match = re.search(r'(\d+)\s*\+?\s*years?\s+(?:of\s+)?experience', raw_lower)
    if exp_match:
        years_exp = int(exp_match.group(1))

    if is_fresher or (not has_experience and years_exp == 0):
        stage = 'fresher'
    elif years_exp <= 3:
        stage = 'junior'
    elif years_exp <= 7:
        stage = 'mid'
    else:
        stage = 'senior'

    return {
        'stage': stage,
        'is_fresher': is_fresher,
        'has_experience': has_experience,
        'has_internship': has_internship,
        'has_projects': has_projects,
        'has_cgpa': has_cgpa,
        'years_exp': years_exp,
    }


def _get_country_rules(country: str) -> dict:
    """Return country-specific resume rules."""
    rules = {
        'India': {
            'include_photo': False,
            'include_dob': False,
            'include_languages': True,
            'date_format': 'Mon YYYY',
            'emphasize_cgpa': True,
            'naukri_optimized': True,
            'objective_vs_summary': 'objective',  # freshers use objective in India
            'standard_sections': ['Projects', 'Education', 'Skills', 'Internships',
                                   'Achievements', 'Certifications', 'Languages'],
            'ats_keywords_note': 'Optimize for Naukri.com and LinkedIn India ATS systems.',
            'font_style': 'professional_clean',
            'page_limit': '1 page for freshers, 2 pages for 5+ years',
        },
        'United States': {
            'include_photo': False,
            'include_dob': False,
            'include_languages': False,
            'date_format': 'Mon YYYY',
            'emphasize_cgpa': False,  # GPA only if 3.5+
            'naukri_optimized': False,
            'objective_vs_summary': 'summary',
            'standard_sections': ['Summary', 'Experience', 'Skills', 'Education',
                                   'Projects', 'Certifications'],
            'ats_keywords_note': 'Optimize for Workday, Greenhouse, Lever ATS systems.',
            'font_style': 'modern_minimal',
            'page_limit': '1 page for <10 years, 2 pages for 10+ years',
        },
        'United Kingdom': {
            'include_photo': False,
            'include_dob': False,
            'include_languages': False,
            'date_format': 'Mon YYYY',
            'emphasize_cgpa': True,  # degree class matters in UK
            'naukri_optimized': False,
            'objective_vs_summary': 'personal_statement',
            'standard_sections': ['Personal Statement', 'Education', 'Experience',
                                   'Skills', 'Projects', 'References'],
            'ats_keywords_note': 'Optimize for Reed, TotalJobs, and LinkedIn UK ATS.',
            'font_style': 'professional_clean',
            'page_limit': '2 pages standard',
        },
        'UAE': {
            'include_photo': True,
            'include_dob': True,
            'include_languages': True,
            'date_format': 'Mon YYYY',
            'emphasize_cgpa': True,
            'naukri_optimized': False,
            'objective_vs_summary': 'objective',
            'standard_sections': ['Objective', 'Education', 'Experience', 'Skills',
                                   'Projects', 'Languages', 'References'],
            'ats_keywords_note': 'Optimize for Bayt.com and GulfTalent ATS. Mention visa status if relevant.',
            'font_style': 'formal_classic',
            'page_limit': '2-3 pages acceptable',
        },
        'Canada': {
            'include_photo': False,
            'include_dob': False,
            'include_languages': True,
            'date_format': 'Mon YYYY',
            'emphasize_cgpa': False,
            'naukri_optimized': False,
            'objective_vs_summary': 'summary',
            'standard_sections': ['Summary', 'Experience', 'Skills', 'Education',
                                   'Projects', 'Certifications', 'Languages'],
            'ats_keywords_note': 'Optimize for Workday, Indeed Canada ATS.',
            'font_style': 'modern_minimal',
            'page_limit': '1-2 pages',
        },
        'Germany': {
            'include_photo': True,
            'include_dob': True,
            'include_languages': True,
            'date_format': 'Mon YYYY',
            'emphasize_cgpa': True,
            'naukri_optimized': False,
            'objective_vs_summary': 'profile',
            'standard_sections': ['Profile', 'Experience', 'Education', 'Skills',
                                   'Projects', 'Languages', 'Certifications'],
            'ats_keywords_note': 'German Lebenslauf format. Optimize for XING and StepStone.',
            'font_style': 'formal_classic',
            'page_limit': '2 pages standard',
        },
        'Australia': {
            'include_photo': False,
            'include_dob': False,
            'include_languages': False,
            'date_format': 'Mon YYYY',
            'emphasize_cgpa': False,
            'naukri_optimized': False,
            'objective_vs_summary': 'summary',
            'standard_sections': ['Summary', 'Experience', 'Skills', 'Education',
                                   'Projects', 'Certifications'],
            'ats_keywords_note': 'Optimize for SEEK, LinkedIn Australia ATS.',
            'font_style': 'modern_minimal',
            'page_limit': '2-3 pages acceptable in AU',
        },
        'Singapore': {
            'include_photo': True,
            'include_dob': True,
            'include_languages': True,
            'date_format': 'Mon YYYY',
            'emphasize_cgpa': True,
            'naukri_optimized': False,
            'objective_vs_summary': 'summary',
            'standard_sections': ['Summary', 'Experience', 'Education', 'Skills',
                                   'Projects', 'Languages', 'Certifications'],
            'ats_keywords_note': 'Optimize for JobsDB, LinkedIn Singapore ATS.',
            'font_style': 'professional_clean',
            'page_limit': '2 pages standard',
        },
    }
    return rules.get(country, rules['India'])


def build_resume_prompt(raw_data: str, job_description: str, country: str, role: str) -> str:
    profile = _detect_profile(raw_data)
    country_rules = _get_country_rules(country)
    stage = profile['stage']

    # Dynamic section order based on stage
    if stage == 'fresher':
        if profile['has_projects']:
            section_order = "Projects → Education → Skills → Internships → Achievements → Certifications"
        else:
            section_order = "Objective → Education → Skills → Achievements → Certifications"
    elif stage == 'junior':
        section_order = "Summary → Experience → Projects → Skills → Education → Certifications"
    elif stage == 'mid':
        section_order = "Summary → Experience → Skills → Projects → Education → Certifications"
    else:  # senior
        section_order = "Executive Summary → Experience → Key Achievements → Skills → Education"

    # Role-specific instructions
    role_lower = role.lower()
    if any(w in role_lower for w in ['data', 'ml', 'ai', 'machine learning']):
        role_hint = "Emphasize: datasets, model accuracy metrics, frameworks (TensorFlow/PyTorch/scikit-learn), research papers, Kaggle rankings."
    elif any(w in role_lower for w in ['devops', 'cloud', 'sre', 'infrastructure']):
        role_hint = "Emphasize: uptime metrics, deployment frequency, tools (Docker/K8s/Terraform/AWS), incident reduction %."
    elif any(w in role_lower for w in ['frontend', 'ui', 'ux']):
        role_hint = "Emphasize: page load improvements, user engagement metrics, design systems, accessibility compliance, Core Web Vitals."
    elif any(w in role_lower for w in ['backend', 'api', 'server']):
        role_hint = "Emphasize: API throughput (req/sec), latency reduction %, database optimization, system design, scalability."
    elif any(w in role_lower for w in ['full stack', 'fullstack']):
        role_hint = "Balance frontend and backend achievements. Emphasize end-to-end ownership and delivery speed."
    elif any(w in role_lower for w in ['product', 'pm', 'manager']):
        role_hint = "Emphasize: revenue impact, user growth %, retention metrics, roadmap ownership, cross-functional leadership."
    else:
        role_hint = "Emphasize technical depth, problem-solving, and measurable impact with numbers."

    cgpa_instruction = ""
    if country_rules['emphasize_cgpa'] and profile['has_cgpa']:
        cgpa_instruction = "Include CGPA prominently in education section. If CGPA >= 8.0/10 or >= 3.5/4.0, add a visual emphasis note in layout_config."
    elif not country_rules['emphasize_cgpa']:
        cgpa_instruction = "Only include GPA/CGPA if it is 3.5/4.0 or above (8.75+/10). Otherwise omit it entirely."

    return f"""You are QuantumCV, a world-class resume architect. Generate a complete, highly tailored resume.

CRITICAL: Return ONLY valid JSON. No markdown, no backticks, no explanation. Pure raw JSON only.

═══ CAREER DATA ═══
{raw_data}

═══ JOB DESCRIPTION ═══
{job_description or 'Not provided — generate a strong general resume for the role.'}

═══ CONTEXT ═══
Country: {country}
Target Role: {role}
Career Stage: {stage} ({profile['years_exp']} years exp detected)
Profile: {'Fresher/Student' if profile['is_fresher'] else 'Professional'}
Has Projects: {profile['has_projects']}
Has Internship: {profile['has_internship']}

═══ COUNTRY RULES FOR {country.upper()} ═══
- Include photo placeholder: {country_rules['include_photo']}
- Include date of birth: {country_rules['include_dob']}
- Include languages section: {country_rules['include_languages']}
- Date format: {country_rules['date_format']}
- CGPA handling: {cgpa_instruction}
- Intro section type: {country_rules['objective_vs_summary']}
- {country_rules['ats_keywords_note']}
- Page limit guidance: {country_rules['page_limit']}

═══ SECTION ORDER ═══
Recommended: {section_order}

═══ ROLE-SPECIFIC FOCUS ═══
{role_hint}

═══ BULLET POINT RULES ═══
- Every bullet MUST start with a strong past-tense action verb
- Include quantified metrics wherever possible (%, numbers, time saved, users, revenue)
- Use STAR format: Situation implied → Task → Action → Result
- Minimum 2, maximum 4 bullets per entry
- Align keywords directly with the JD for ATS matching
- For {country}: use terminology familiar to local recruiters

═══ OUTPUT JSON SCHEMA ═══
Return this exact structure:

{{
  "name": "string",
  "email": "string",
  "phone": "string",
  "linkedin": "string",
  "github": "string",
  "location": "string",
  "target_role": "{role}",
  "country": "{country}",
  "career_stage": "{stage}",
  "ai_confidence": 0,
  "ats_score": 0,

  "layout_config": {{
    "intro_section_type": "{country_rules['objective_vs_summary']}",
    "show_photo_placeholder": {str(country_rules['include_photo']).lower()},
    "show_dob": {str(country_rules['include_dob']).lower()},
    "show_languages": {str(country_rules['include_languages']).lower()},
    "page_limit": "{country_rules['page_limit']}",
    "font_style": "{country_rules['font_style']}",
    "accent_color": "#2563EB",
    "section_order": {json.dumps(section_order.split(' → '))},
    "emphasize_cgpa": {str(country_rules['emphasize_cgpa'] and profile['has_cgpa']).lower()},
    "ats_platform": "{country_rules['ats_keywords_note'][:40]}"
  }},

  "sections": [
    {{
      "id": "unique_snake_case_id",
      "title": "SECTION TITLE",
      "type": "summary|objective|experience|education|projects|skills|achievements|certifications|languages",
      "order": 1,
      "entries": [
        {{
          "id": "entry_unique_id",
          "title": "Position/Degree/Project Title",
          "subtitle": "Company/University/Tech Stack",
          "location": "City, Country",
          "date_start": "Mon YYYY",
          "date_end": "Mon YYYY or Present",
          "bullets": ["Bullet 1", "Bullet 2"],
          "skills": ["skill1", "skill2"]
        }}
      ],
      "skill_groups": [
        {{
          "category": "Languages",
          "skills": ["Python", "JavaScript"]
        }}
      ],
      "summary_text": "Only for summary/objective/profile type sections"
    }}
  ]
}}

RULES:
- entries → experience, education, projects, achievements, certifications
- skill_groups → ONLY for skills type
- summary_text → ONLY for summary/objective/profile/personal_statement types
- Sort sections by the recommended section_order above
- ai_confidence: score 0-100 based on how complete the input data was
- ats_score: score 0-100 based on JD keyword alignment
"""


def generate_resume(raw_data: str, job_description: str, country: str, role: str) -> dict:
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured in .env")

    prompt = build_resume_prompt(raw_data, job_description, country, role)
    model = _get_model()

    generation_config = genai.GenerationConfig(
        temperature=0.3,
        top_p=0.9,
        max_output_tokens=8192,
    )

    try:
        response = model.generate_content(prompt, generation_config=generation_config)
        raw_text = response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise RuntimeError(f"AI generation failed: {str(e)}")

    # Strip markdown fences if Gemini wraps in ```json
    raw_text = re.sub(r'^```(?:json)?\s*', '', raw_text)
    raw_text = re.sub(r'\s*```$', '', raw_text)
    raw_text = raw_text.strip()

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}\nRaw: {raw_text[:800]}")
        match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if match:
            data = json.loads(match.group())
        else:
            raise ValueError("AI returned malformed JSON. Please try again.")

    # Sort sections by order field
    if 'sections' in data:
        data['sections'].sort(key=lambda s: s.get('order', 99))

    return data


def enhance_bullet(bullet: str, context: str) -> str:
    model = _get_model()
    prompt = f"""Rewrite this resume bullet to be more impactful, quantified, and ATS-optimised.
Context: {context}
Original bullet: {bullet}
Return ONLY the improved bullet. No explanation. Start with a strong action verb."""
    response = model.generate_content(prompt)
    return response.text.strip()
