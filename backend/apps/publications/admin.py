from django.contrib import admin

from .models import OfficialPublication


@admin.register(OfficialPublication)
class OfficialPublicationAdmin(admin.ModelAdmin):
    list_display = ("title", "publication_type", "status", "is_public", "is_featured", "published_at")
    list_filter = ("publication_type", "status", "is_public", "is_featured")
    search_fields = ("title", "excerpt", "body", "scope_label")
