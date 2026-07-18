from django.contrib import admin

from .models import EducationalContent


@admin.register(EducationalContent)
class EducationalContentAdmin(admin.ModelAdmin):
    list_display = ("title", "topic", "content_type", "is_ai_generated", "is_published")
    list_filter = ("topic", "content_type", "is_published")
    prepopulated_fields = {"slug": ("title",)}

