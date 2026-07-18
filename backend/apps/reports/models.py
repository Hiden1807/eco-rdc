from django.conf import settings
from django.db import models

from apps.ai.json_safety import make_json_safe


class Report(models.Model):
    class ReportType(models.TextChoices):
        DAILY = "daily", "Journalier"
        WEEKLY = "weekly", "Hebdomadaire"
        MONTHLY = "monthly", "Mensuel"
        COMMUNE = "commune", "Par commune"
        PROVINCE = "province", "Par province"
        NATIONAL = "national", "National"
        URGENCE = "urgence", "Urgence"
        PERFORMANCE = "performance", "Performance"
        RECOMMANDATIONS = "recommandations", "Recommandations"

    title = models.CharField(max_length=180)
    report_type = models.CharField(max_length=20, choices=ReportType.choices, db_index=True)
    summary = models.TextField()
    statistics = models.JSONField(default=dict, blank=True)
    major_incidents = models.JSONField(default=list, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    chart_payload = models.JSONField(default=dict, blank=True)
    pdf = models.FileField(upload_to="reports/", blank=True, null=True)
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-generated_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        self.statistics = make_json_safe(self.statistics)
        self.major_incidents = make_json_safe(self.major_incidents)
        self.recommendations = make_json_safe(self.recommendations)
        self.chart_payload = make_json_safe(self.chart_payload)
        super().save(*args, **kwargs)
