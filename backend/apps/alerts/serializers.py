from rest_framework import serializers

from .models import OfficialAlert


class OfficialAlertSerializer(serializers.ModelSerializer):
    province_name = serializers.CharField(source="province.name", read_only=True)
    commune_name = serializers.CharField(source="commune.name", read_only=True)
    published_by_name = serializers.CharField(source="published_by.get_full_name", read_only=True)

    class Meta:
        model = OfficialAlert
        fields = [
            "id",
            "title",
            "message",
            "alert_type",
            "severity",
            "province",
            "province_name",
            "commune",
            "commune_name",
            "starts_at",
            "ends_at",
            "is_active",
            "is_official",
            "published_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["published_by_name", "created_at", "updated_at"]

