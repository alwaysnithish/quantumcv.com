from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import OTPVerification


def send_otp_email(email: str) -> str:
    """Generate OTP, save to DB, send email. Returns the OTP."""
    # Invalidate old OTPs for this email
    OTPVerification.objects.filter(email=email, is_used=False).update(is_used=True)

    otp = OTPVerification.generate_otp()
    OTPVerification.objects.create(email=email, otp=otp)

    subject = "Your QuantumCV verification code"
    message = f"""
Your QuantumCV verification code is:

  {otp}

This code expires in {settings.OTP_EXPIRY_MINUTES} minutes.
If you didn't request this, you can safely ignore this email.

— QuantumCV Team
"""
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px; }}
    .card {{ max-width: 480px; margin: 0 auto; background: white; border-radius: 16px;
             padding: 40px; box-shadow: 0 4px 24px rgba(37,99,235,0.08); }}
    .logo {{ font-size: 22px; font-weight: 700; color: #2563EB; letter-spacing: -0.5px; margin-bottom: 28px; }}
    .label {{ font-size: 13px; color: #64748b; margin-bottom: 12px; }}
    .otp {{ font-size: 42px; font-weight: 700; letter-spacing: 10px; color: #0f172a;
             background: #eff6ff; border-radius: 12px; padding: 20px; text-align: center;
             border: 2px dashed #bfdbfe; margin: 16px 0 24px; }}
    .expiry {{ font-size: 13px; color: #94a3b8; }}
    .footer {{ margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9;
               font-size: 12px; color: #cbd5e1; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">⚡ QuantumCV</div>
    <p class="label">Your one-time verification code</p>
    <div class="otp">{otp}</div>
    <p class="expiry">⏱ Expires in {settings.OTP_EXPIRY_MINUTES} minutes</p>
    <div class="footer">If you didn't request this, ignore this email. Your account is safe.</div>
  </div>
</body>
</html>
"""

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        html_message=html_message,
        fail_silently=False,
    )
    return otp


def verify_otp(email: str, otp: str) -> tuple[bool, str]:
    """Returns (success, message)"""
    try:
        record = OTPVerification.objects.filter(
            email=email, is_used=False
        ).latest('created_at')
    except OTPVerification.DoesNotExist:
        return False, "No OTP found. Please request a new one."

    if record.is_expired():
        record.is_used = True
        record.save()
        return False, "OTP has expired. Please request a new one."

    record.attempts += 1
    if record.attempts > 5:
        record.is_used = True
        record.save()
        return False, "Too many attempts. Please request a new OTP."

    if record.otp != otp.strip():
        record.save()
        return False, f"Invalid OTP. {5 - record.attempts} attempts remaining."

    record.is_used = True
    record.save()
    return True, "Verified successfully."
