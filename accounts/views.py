from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_protect
import json, re
from django.views.decorators.csrf import csrf_exempt

from .models import User, OTPVerification
from .utils import send_otp_email, verify_otp


def login_view(request):
    if request.user.is_authenticated:
        return redirect('resume:dashboard')
    return render(request, 'accounts/login.html')


def verify_view(request):
    email = request.session.get('otp_email')
    if not email:
        return redirect('accounts:login')
    return render(request, 'accounts/verify_otp.html', {'email': email})

@csrf_exempt
@require_POST

def send_otp_view(request):
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
    except (json.JSONDecodeError, AttributeError):
        return JsonResponse({'success': False, 'message': 'Invalid request.'}, status=400)

    if not email or not re.match(r'^[\w.+-]+@[\w-]+\.[a-z]{2,}$', email):
        return JsonResponse({'success': False, 'message': 'Please enter a valid email address.'}, status=400)

    try:
        send_otp_email(email)
        request.session['otp_email'] = email
        return JsonResponse({'success': True, 'message': 'Verification code sent to your email.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': 'Failed to send email. Please try again.'}, status=500)


@require_POST
@csrf_exempt
def verify_otp_view(request):
    try:
        data = json.loads(request.body)
        otp = data.get('otp', '').strip()
        full_name = data.get('full_name', '').strip()
    except (json.JSONDecodeError, AttributeError):
        return JsonResponse({'success': False, 'message': 'Invalid request.'}, status=400)

    email = request.session.get('otp_email')
    if not email:
        return JsonResponse({'success': False, 'message': 'Session expired. Please start again.'}, status=400)

    success, message = verify_otp(email, otp)
    if not success:
        return JsonResponse({'success': False, 'message': message}, status=400)

    # Get or create user
    user, created = User.objects.get_or_create(email=email)
    if created or (full_name and not user.full_name):
        user.full_name = full_name or ''
        user.save()

    login(request, user, backend='django.contrib.auth.backends.ModelBackend')
    del request.session['otp_email']

    return JsonResponse({
        'success': True,
        'message': 'Welcome to QuantumCV!',
        'redirect': '/resume/dashboard/',
        'is_new': created
    })


@require_POST
def resend_otp_view(request):
    email = request.session.get('otp_email')
    if not email:
        return JsonResponse({'success': False, 'message': 'Session expired.'}, status=400)
    try:
        send_otp_email(email)
        return JsonResponse({'success': True, 'message': 'New code sent.'})
    except Exception:
        return JsonResponse({'success': False, 'message': 'Failed to resend. Try again.'}, status=500)


def logout_view(request):
    logout(request)
    return redirect('accounts:login')
