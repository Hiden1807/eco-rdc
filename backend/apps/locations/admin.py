from django.contrib import admin

from .models import Commune, Province


@admin.register(Province)
class ProvinceAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "ecological_score")
    search_fields = ("name", "code")


@admin.register(Commune)
class CommuneAdmin(admin.ModelAdmin):
    list_display = ("name", "province", "risk_level", "ecological_score")
    list_filter = ("province", "risk_level")
    search_fields = ("name", "code")

