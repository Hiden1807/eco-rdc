from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class EcoUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("ECO RDC", {"fields": ("role", "phone", "avatar", "organization", "province", "commune", "is_verified")}),
    )
    list_display = ("username", "email", "role", "commune", "is_verified", "is_staff")
    list_filter = ("role", "is_verified", "is_staff", "is_active")

