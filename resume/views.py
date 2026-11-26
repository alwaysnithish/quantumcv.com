from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_POST, require_http_methods
from django.views.decorators.csrf import csrf_protect
from django.utils import timezone
import json, logging

from .models import Resume, ResumeVersion
from ai_engine.gemini import generate_resume, enhance_bullet
from pdf_engine.generator import generate_resume_pdf

logger = logging.getLogger(__name__)


# ── DASHBOARD ──────────────────────────────────────────────

@login_required(login_url='/')
def dashboard(request):
    resumes = Resume.objects.filter(user=request.user)
    stats = {
        'total': resumes.count(),
        'generated': resumes.filter(status='generated').count(),
        'exported': resumes.filter(status='exported').count(),
        'avg_ats': 0,  # placeholder, calculated below
    }
    ats_scores = list(resumes.exclude(ats_score__isnull=True).exclude(ats_score=0).values_list('ats_score', flat=True))
    stats['avg_ats'] = int(sum(ats_scores) / len(ats_scores)) if ats_scores else 0


    return render(request, 'resume/dashboard.html', {
        'resumes': resumes[:12],
        'stats': stats,
        'user': request.user,
    })


# ── BUILDER ──────────────────────────────────────────────

@login_required(login_url='/')
def builder(request, resume_id=None):
    resume = None
    if resume_id:
        resume = get_object_or_404(Resume, id=resume_id, user=request.user)
    return render(request, 'resume/builder.html', {
        'resume': resume,
        'resume_json': json.dumps(resume.generated_data) if resume and resume.generated_data else 'null',
        'user': request.user,
    })


# ── API: CREATE / SAVE RESUME ──────────────────────────────

@login_required(login_url='/')
@require_POST
@csrf_protect
def create_resume(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON.'}, status=400)

    resume = Resume.objects.create(
        user=request.user,
        title=data.get('title', 'Untitled Resume'),
        target_role=data.get('target_role', ''),
        country=data.get('country', 'India'),
        raw_data=data.get('raw_data', ''),
        job_description=data.get('job_description', ''),
        status='draft',
    )
    return JsonResponse({'success': True, 'resume_id': str(resume.id)})


@login_required(login_url='/')
@require_POST
@csrf_protect
def save_resume(request, resume_id):
    resume = get_object_or_404(Resume, id=resume_id, user=request.user)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON.'}, status=400)

    # Save version snapshot before updating
    if resume.generated_data:
        last_version = resume.versions.first()
        version_num = (last_version.version_number + 1) if last_version else 1
        ResumeVersion.objects.create(
            resume=resume,
            version_number=version_num,
            snapshot_data=resume.generated_data,
            label=f"Auto-save v{version_num}"
        )

    resume.title = data.get('title', resume.title)
    resume.generated_data = data.get('generated_data', resume.generated_data)
    resume.raw_data = data.get('raw_data', resume.raw_data)
    resume.job_description = data.get('job_description', resume.job_description)
    resume.save()

    return JsonResponse({'success': True, 'message': 'Saved.', 'updated_at': resume.updated_at.strftime('%b %d, %H:%M')})


@login_required(login_url='/')
def delete_resume(request, resume_id):
    resume = get_object_or_404(Resume, id=resume_id, user=request.user)
    resume.delete()
    return JsonResponse({'success': True})


# ── API: GENERATE WITH AI ──────────────────────────────────

@login_required(login_url='/')
@require_POST
@csrf_protect
def generate_resume_view(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON.'}, status=400)

    raw_data = data.get('raw_data', '').strip()
    job_description = data.get('job_description', '').strip()
    country = data.get('country', 'India')
    role = data.get('role', 'Software Engineer')
    resume_id = data.get('resume_id')

    if not raw_data:
        return JsonResponse({'success': False, 'message': 'Career data is required.'}, status=400)

    try:
        result = generate_resume(raw_data, job_description, country, role)
    except ValueError as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)
    except RuntimeError as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=503)
    except Exception as e:
        logger.error(f"Unexpected generation error: {e}")
        return JsonResponse({'success': False, 'message': 'Generation failed. Please try again.'}, status=500)

    # Save to resume object
    if resume_id:
        try:
            resume = Resume.objects.get(id=resume_id, user=request.user)
            resume.generated_data = result
            resume.raw_data = raw_data
            resume.job_description = job_description
            resume.status = 'generated'
            resume.ai_confidence_score = result.get('ai_confidence', 0)
            resume.ats_score = result.get('ats_score', 0)
            resume.title = f"{result.get('name', 'Resume')} — {role}"
            resume.target_role = role
            resume.save()
        except Resume.DoesNotExist:
            pass
    else:
        resume = Resume.objects.create(
            user=request.user,
            title=f"{result.get('name', 'Resume')} — {role}",
            target_role=role,
            country=country,
            raw_data=raw_data,
            job_description=job_description,
            generated_data=result,
            status='generated',
            ai_confidence_score=result.get('ai_confidence', 0),
            ats_score=result.get('ats_score', 0),
        )

    return JsonResponse({
        'success': True,
        'resume_id': str(resume.id),
        'data': result,
    })


# ── API: ENHANCE BULLET ──────────────────────────────────

@login_required(login_url='/')
@require_POST
@csrf_protect
def enhance_bullet_view(request):
    try:
        data = json.loads(request.body)
        bullet = data.get('bullet', '')
        context = data.get('context', '')
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON.'}, status=400)

    if not bullet:
        return JsonResponse({'success': False, 'message': 'Bullet text required.'}, status=400)

    try:
        improved = enhance_bullet(bullet, context)
        return JsonResponse({'success': True, 'improved': improved})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


# ── API: EXPORT PDF ──────────────────────────────────────

@login_required(login_url='/')
def export_pdf(request, resume_id):
    resume = get_object_or_404(Resume, id=resume_id, user=request.user)

    if not resume.generated_data:
        return JsonResponse({'success': False, 'message': 'No resume data to export.'}, status=400)

    try:
        pdf_bytes = generate_resume_pdf(resume.generated_data, resume)
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        return JsonResponse({'success': False, 'message': 'PDF generation failed.'}, status=500)

    resume.status = 'exported'
    resume.last_exported = timezone.now()
    resume.save()

    name_slug = resume.generated_data.get('name', 'resume').replace(' ', '_')
    filename = f"QuantumCV_{name_slug}_{resume.target_role.replace(' ', '_')}.pdf"

    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


# ── API: VERSION HISTORY ─────────────────────────────────

@login_required(login_url='/')
def version_history(request, resume_id):
    resume = get_object_or_404(Resume, id=resume_id, user=request.user)
    versions = resume.versions.all()[:10]
    return JsonResponse({
        'versions': [
            {
                'id': v.id,
                'version_number': v.version_number,
                'label': v.label,
                'created_at': v.created_at.strftime('%b %d, %Y %H:%M'),
            }
            for v in versions
        ]
    })


@login_required(login_url='/')
def restore_version(request, resume_id, version_id):
    resume = get_object_or_404(Resume, id=resume_id, user=request.user)
    version = get_object_or_404(ResumeVersion, id=version_id, resume=resume)
    resume.generated_data = version.snapshot_data
    resume.save()
    return JsonResponse({'success': True, 'data': version.snapshot_data})
