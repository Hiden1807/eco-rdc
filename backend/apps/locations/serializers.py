from rest_framework import serializers

from .models import Commune, Province


class ProvinceSerializer(serializers.ModelSerializer):
    communes_count = serializers.IntegerField(source="communes.count", read_only=True)

    class Meta:
        model = Province
        fields = [
            "id",
            "name",
            "code",
            "centroid_latitude",
            "centroid_longitude",
            "ecological_score",
            "communes_count",
        ]


class CommuneSerializer(serializers.ModelSerializer):
    province_name = serializers.CharField(source="province.name", read_only=True)

    class Meta:
        model = Commune
        fields = [
            "id",
            "province",
            "province_name",
            "name",
            "code",
            "centroid_latitude",
            "centroid_longitude",
            "ecological_score",
            "risk_level",
        ]

