from django.contrib import admin

from .models import AuthorityComment, Category, ResolutionProof, Signalement, StatusHistory


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Signalement)
class SignalementAdmin(admin.ModelAdmin):
    list_display = ("title", "commune", "gravity", "status", "ai_score", "created_at")
    list_filter = ("status", "gravity", "category", "commune")
    search_fields = ("title", "description", "ai_summary")


admin.site.register(StatusHistory)
admin.site.register(AuthorityComment)
admin.site.register(ResolutionProof)
