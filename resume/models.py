from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid, json


class Resume(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('generated', 'Generated'),
        ('exported', 'Exported'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Only ONE user field
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='resumes')

    title = models.CharField(max_length=200, default='Untitled Resume')
    target_role = models.CharField(max_length=200, blank=True)
    target_company = models.CharField(max_length=200, blank=True)
    country = models.CharField(max_length=100, default='India')

    raw_data = models.TextField(blank=True)
    job_description = models.TextField(blank=True)

    generated_data = models.JSONField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    updated_at = models.DateTimeField(auto_now=True)
    last_exported = models.DateTimeField(null=True, blank=True)

    ats_score = models.IntegerField(null=True, blank=True)
    ai_confidence_score = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} — {self.user.email if hasattr(self, 'user') and self.user else 'No user'}"

class ResumeVersion(models.Model):
    """Snapshot of a resume at a point in time."""
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField(default=1)
    snapshot_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    label = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['-version_number']

    def __str__(self):
        return f"{self.resume.title} v{self.version_number}"
