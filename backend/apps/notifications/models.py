from django.conf import settings
from django.db import models

from apps.ai.json_safety import make_json_safe


class Notification(models.Model):
    class Type(models.TextChoices):
        ACCOUNT_CREATED = "account_created", "Compte cree"
        SIGNALEMENT_RECEIVED = "signalement_received", "Signalement recu"
        SIGNALEMENT_VALIDATED = "signalement_validated", "Signalement valide"
        SIGNALEMENT_IN_PROGRESS = "signalement_in_progress", "Signalement en cours"
        SIGNALEMENT_RESOLVED = "signalement_resolved", "Signalement resolu"
        SIGNALEMENT_REJECTED = "signalement_rejected", "Signalement rejete"
        CRITICAL_CASE = "critical_case", "Cas critique"
        REPORT_AVAILABLE = "report_available", "Rapport disponible"
        RISK_ZONE = "risk_zone", "Zone a risque"
        OFFICIAL_ALERT = "official_alert", "Alerte officielle"
        EDUCATION_CONTENT = "education_content", "Contenu educatif"
        AI_INCONSISTENCY = "ai_inconsistency", "Incoherence IA"
        SYSTEM_LOG = "system_log", "Alerte systeme"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=40, choices=Type.choices)
    title = models.CharField(max_length=160)
    message = models.TextField()
    payload = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        self.payload = make_json_safe(self.payload)
        super().save(*args, **kwargs)
