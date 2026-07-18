from django.conf import settings
from django.db import models


class OfficialAlert(models.Model):
    class AlertType(models.TextChoices):
        RAIN = "rain", "Alerte pluie"
        FLOOD = "flood", "Alerte inondation"
        POLLUTION = "pollution", "Alerte pollution"
        EROSION = "erosion", "Alerte erosion"
        SANITATION = "sanitation", "Alerte salubrite"
        CLEANUP = "cleanup", "Campagne de nettoyage"

    class Severity(models.TextChoices):
        INFO = "info", "Information"
        WATCH = "watch", "Surveillance"
        WARNING = "warning", "Alerte"
        CRITICAL = "critical", "Critique"

    title = models.CharField(max_length=180)
    message = models.TextField()
    alert_type = models.CharField(max_length=30, choices=AlertType.choices, db_index=True)
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.INFO, db_index=True)
    province = models.ForeignKey("locations.Province", on_delete=models.SET_NULL, null=True, blank=True)
    commune = models.ForeignKey("locations.Commune", on_delete=models.SET_NULL, null=True, blank=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_official = models.BooleanField(default=True)
    published_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-starts_at"]
        indexes = [
            models.Index(fields=["is_active", "severity"]),
            models.Index(fields=["province", "commune", "is_active"]),
        ]

    def __str__(self):
        return self.title

