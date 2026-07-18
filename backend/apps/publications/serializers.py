from rest_framework import serializers

from .models import OfficialPublication


class OfficialPublicationSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)
    province_name = serializers.CharField(source="province.name", read_only=True)
    commune_name = serializers.CharField(source="commune.name", read_only=True)

    class Meta:
        model = OfficialPublication
        fields = [
            "id",
            "title",
            "slug",
            "publication_type",
            "excerpt",
            "body",
            "cover_image",
            "attachment_pdf",
            "video_file",
            "video_url",
            "scope_label",
            "province",
            "province_name",
            "commune",
            "commune_name",
            "status",
            "is_public",
            "is_featured",
            "author_name",
            "published_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["author_name", "published_at", "created_at", "updated_at"]
        extra_kwargs = {"slug": {"required": False, "allow_blank": True}}
