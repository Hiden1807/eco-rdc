from django.conf import settings
from django.db import models


class EducationalContent(models.Model):
    class ContentType(models.TextChoices):
        ARTICLE = "article", "Article"
        CONSEIL = "conseil", "Conseil"
        GUIDE = "guide", "Guide"
        PDF = "pdf", "PDF"
        VIDEO = "video", "Video"
        TUTORIEL = "tutoriel", "Tutoriel"
        COMMUNIQUE = "communique", "Communique"
        CAMPAGNE = "campagne", "Campagne"

    class Status(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        PUBLISHED = "published", "Publie"
        ARCHIVED = "archived", "Archive"

    title = models.CharField(max_length=180)
    slug = models.SlugField(unique=True)
    content_type = models.CharField(max_length=20, choices=ContentType.choices, default=ContentType.ARTICLE)
    topic = models.CharField(max_length=120, db_index=True)
    excerpt = models.TextField()
    body = models.TextField()
    image = models.ImageField(upload_to="education/", blank=True, null=True)
    pdf_file = models.FileField(upload_to="education/pdfs/", blank=True, null=True)
    video_file = models.FileField(upload_to="education/videos/", blank=True, null=True)
    video_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PUBLISHED, db_index=True)
    is_official = models.BooleanField(default=False, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_education_contents",
    )
    published_at = models.DateTimeField(null=True, blank=True)
    target_commune = models.ForeignKey("locations.Commune", on_delete=models.SET_NULL, null=True, blank=True)
    is_ai_generated = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True, db_index=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
