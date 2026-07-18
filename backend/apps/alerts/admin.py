from django.contrib import admin

from .models import OfficialAlert


@admin.register(OfficialAlert)
class OfficialAlertAdmin(admin.ModelAdmin):
    list_display = ("title", "alert_type", "severity", "commune", "is_active", "starts_at")
    list_filter = ("alert_type", "severity", "is_active", "province", "commune")
    search_fields = ("title", "message")

