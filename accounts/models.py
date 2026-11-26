from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
import random, string


class UserManager(BaseUserManager):
    def create_user(self, email, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        user = self.create_user(email, **extra_fields)
        if password:
            user.set_password(password)
            user.save()
        return user


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    avatar_initials = models.CharField(max_length=3, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = UserManager()

    def save(self, *args, **kwargs):
        if self.full_name and not self.avatar_initials:
            parts = self.full_name.strip().split()
            self.avatar_initials = ''.join(p[0].upper() for p in parts[:2])
        elif not self.avatar_initials:
            self.avatar_initials = self.email[0].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email


class OTPVerification(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def generate_otp(cls):
        return ''.join(random.choices(string.digits, k=6))

    def is_expired(self):
        from django.conf import settings
        expiry_minutes = getattr(settings, 'OTP_EXPIRY_MINUTES', 10)
        return (timezone.now() - self.created_at).seconds > expiry_minutes * 60

    def __str__(self):
        return f"{self.email} — {self.otp}"
