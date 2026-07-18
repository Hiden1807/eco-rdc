from django.contrib import admin

from .models import AIAnalysis, AIAnalysisLog, AIConversation, AIInsight, AIMessage, AINotificationRule


@admin.register(AIAnalysis)
class AIAnalysisAdmin(admin.ModelAdmin):
    list_display = ("signalement", "category_detected", "gravity", "confidence_score", "created_at")
    list_filter = ("gravity", "coherence")


class AIMessageInline(admin.TabularInline):
    model = AIMessage
    extra = 0
    readonly_fields = ("role", "role_of_user_at_message", "content", "intent", "metadata", "created_at")
    can_delete = False


@admin.register(AIConversation)
class AIConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "role_at_creation", "page_context", "updated_at", "is_archived")
    list_filter = ("role_at_creation", "is_archived")
    search_fields = ("id", "user__username", "user__email")
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [AIMessageInline]


@admin.register(AIAnalysisLog)
class AIAnalysisLogAdmin(admin.ModelAdmin):
    list_display = ("operation", "provider", "model_name", "success", "fallback_used", "duration_ms", "created_at")
    list_filter = ("operation", "provider", "success", "fallback_used")
    search_fields = ("target_type", "target_id", "error_code")
    readonly_fields = ("created_at",)


@admin.register(AIInsight)
class AIInsightAdmin(admin.ModelAdmin):
    list_display = ("title", "level", "target_role", "territory_scope", "is_active", "created_at")
    list_filter = ("level", "target_role", "is_active")
    search_fields = ("title", "description", "territory_scope")


@admin.register(AINotificationRule)
class AINotificationRuleAdmin(admin.ModelAdmin):
    list_display = ("rule_code", "target_type", "target_id", "recipients_summary", "triggered_at")
    list_filter = ("rule_code", "target_type")
    search_fields = ("target_id", "recipients_summary")
