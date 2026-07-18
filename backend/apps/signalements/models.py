from django.conf import settings
from django.db import models

from apps.ai.json_safety import make_json_safe


class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True)
    icon = models.CharField(max_length=48, default="leaf")
    color = models.CharField(max_length=16, default="#15803d")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Signalement(models.Model):
    class Status(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente"
        VALIDE = "valide", "Valide"
        EN_COURS = "en_cours", "En cours"
        RESOLU = "resolu", "Resolu"
        REJETE = "rejete", "Rejete"

    class Gravity(models.TextChoices):
        FAIBLE = "faible", "Faible"
        MOYEN = "moyen", "Moyen"
        ELEVE = "eleve", "Eleve"
        CRITIQUE = "critique", "Critique"

    class PositionSource(models.TextChoices):
        BROWSER = "browser", "GPS navigateur"
        EXIF = "exif", "Metadata EXIF"
        MANUAL = "manual", "Carte manuelle"
        UNKNOWN = "unknown", "Inconnue"

    title = models.CharField(max_length=180)
    description = models.TextField()
    photo = models.ImageField(upload_to="signalements/")
    before_photo = models.ImageField(upload_to="signalements/before/", blank=True, null=True)
    after_photo = models.ImageField(upload_to="signalements/after/", blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="signalements")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    province = models.ForeignKey("locations.Province", on_delete=models.SET_NULL, null=True, blank=True)
    commune = models.ForeignKey("locations.Commune", on_delete=models.SET_NULL, null=True, blank=True)
    address_text = models.CharField(max_length=240, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    gps_accuracy = models.DecimalField(max_digits=9, decimal_places=2, null=True, blank=True)
    position_source = models.CharField(max_length=20, choices=PositionSource.choices, default=PositionSource.UNKNOWN)
    exif_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    exif_longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    exif_taken_at = models.DateTimeField(null=True, blank=True)
    position_discrepancy_m = models.PositiveIntegerField(null=True, blank=True)
    detected_category_label = models.CharField(max_length=120, blank=True)
    gravity = models.CharField(max_length=20, choices=Gravity.choices, default=Gravity.MOYEN, db_index=True)
    urgency_level = models.CharField(max_length=80, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.EN_ATTENTE, db_index=True)
    ai_score = models.PositiveSmallIntegerField(default=0)
    eco_score_impact = models.PositiveSmallIntegerField(default=0)
    ai_summary = models.TextField(blank=True)
    ai_recommendation = models.TextField(blank=True)
    is_probable_duplicate = models.BooleanField(default=False, db_index=True)
    duplicate_of = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True)
    fraud_flags = models.JSONField(default=list, blank=True)
    authority_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "gravity"]),
            models.Index(fields=["commune", "status"]),
            models.Index(fields=["latitude", "longitude"]),
            models.Index(fields=["created_at", "category"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        self.fraud_flags = make_json_safe(self.fraud_flags)
        super().save(*args, **kwargs)


class StatusHistory(models.Model):
    signalement = models.ForeignKey(Signalement, on_delete=models.CASCADE, related_name="status_history")
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class AuthorityComment(models.Model):
    signalement = models.ForeignKey(Signalement, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    body = models.TextField()
    is_internal = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class ResolutionProof(models.Model):
    signalement = models.ForeignKey(Signalement, on_delete=models.CASCADE, related_name="resolution_proofs")
    photo = models.ImageField(upload_to="signalements/resolution/")
    comment = models.TextField()
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    resolved_at = models.DateTimeField(auto_now_add=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)

    class Meta:
        ordering = ["-resolved_at"]

    def __str__(self):
        return f"Preuve resolution #{self.pk} - {self.signalement_id}"
