from rest_framework import serializers

from .models import EducationalContent


class EducationalContentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)
    commune_name = serializers.CharField(source="target_commune.name", read_only=True)

    class Meta:
        model = EducationalContent
        fields = [
            "id",
            "title",
            "slug",
            "content_type",
            "topic",
            "excerpt",
            "body",
            "image",
            "pdf_file",
            "video_file",
            "video_url",
            "status",
            "is_official",
            "is_featured",
            "approved_by",
            "published_at",
            "target_commune",
            "commune_name",
            "is_ai_generated",
            "is_published",
            "author_name",
            "created_at",
            "updated_at",
        ]
