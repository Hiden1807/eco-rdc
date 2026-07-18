from django.conf import settings
from django.db import models


class OfficialPublication(models.Model):
    class PublicationType(models.TextChoices):
        ACTUALITE = "actualite", "Actualite"
        EDUCATION = "education", "Education"
        COMMUNIQUE = "communique", "Communique"
        RAPPORT_PUBLIC = "rapport-public", "Mise a disposition"
        CAMPAGNE = "campagne", "Campagne"

    class Status(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        PUBLISHED = "published", "Publie"
        ARCHIVED = "archived", "Archive"

    title = models.CharField(max_length=180)
    slug = models.SlugField(unique=True)
    publication_type = models.CharField(max_length=30, choices=PublicationType.choices, db_index=True)
    excerpt = models.TextField()
    body = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to="publications/images/", blank=True, null=True)
    attachment_pdf = models.FileField(upload_to="publications/pdfs/", blank=True, null=True)
    video_file = models.FileField(upload_to="publications/videos/", blank=True, null=True)
    video_url = models.URLField(blank=True)
    scope_label = models.CharField(max_length=120, blank=True)
    province = models.ForeignKey("locations.Province", on_delete=models.SET_NULL, null=True, blank=True)
    commune = models.ForeignKey("locations.Commune", on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PUBLISHED, db_index=True)
    is_public = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "publications_officielles"
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["publication_type", "status", "is_public"]),
            models.Index(fields=["province", "commune", "status"]),
        ]

    def __str__(self):
        return self.title
