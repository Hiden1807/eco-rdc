import os

from django.conf import settings
from rest_framework import serializers

from apps.ai.models import AIAnalysis
from apps.locations.serializers import CommuneSerializer, ProvinceSerializer

from .models import AuthorityComment, Category, ResolutionProof, Signalement, StatusHistory


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "icon", "color", "is_active"]


class AIAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIAnalysis
        fields = [
            "category_detected",
            "gravity",
            "urgency",
            "summary",
            "recommendation",
            "confidence_score",
            "coherence",
            "intervention_type",
            "priority_level",
            "recommended_delay",
            "suggested_team",
            "duplicate_probability",
            "fraud_flags",
            "created_at",
        ]


class StatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source="changed_by.get_full_name", read_only=True)

    class Meta:
        model = StatusHistory
        fields = ["id", "old_status", "new_status", "changed_by_name", "comment", "created_at"]


class AuthorityCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)

    class Meta:
        model = AuthorityComment
        fields = ["id", "author_name", "body", "is_internal", "created_at"]


class ResolutionProofSerializer(serializers.ModelSerializer):
    resolved_by_name = serializers.CharField(source="resolved_by.get_full_name", read_only=True)

    class Meta:
        model = ResolutionProof
        fields = ["id", "photo", "comment", "resolved_by_name", "resolved_at", "latitude", "longitude"]


class SignalementListSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(read_only=True)
    commune_id = serializers.IntegerField(read_only=True)
    province_id = serializers.IntegerField(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    commune_name = serializers.CharField(source="commune.name", read_only=True)
    province_name = serializers.CharField(source="province.name", read_only=True)
    citizen_name = serializers.CharField(source="created_by.get_full_name", read_only=True)

    class Meta:
        model = Signalement
        fields = [
            "id",
            "title",
            "description",
            "photo",
            "category_id",
            "category_name",
            "detected_category_label",
            "province_id",
            "province_name",
            "commune_id",
            "commune_name",
            "address_text",
            "latitude",
            "longitude",
            "gps_accuracy",
            "gravity",
            "urgency_level",
            "status",
            "ai_score",
            "ai_summary",
            "ai_recommendation",
            "is_probable_duplicate",
            "citizen_name",
            "created_at",
            "updated_at",
        ]


class SignalementDetailSerializer(SignalementListSerializer):
    category = CategorySerializer(read_only=True)
    province = ProvinceSerializer(read_only=True)
    commune = CommuneSerializer(read_only=True)
    analysis = AIAnalysisSerializer(read_only=True)
    status_history = StatusHistorySerializer(many=True, read_only=True)
    comments = AuthorityCommentSerializer(many=True, read_only=True)
    resolution_proofs = ResolutionProofSerializer(many=True, read_only=True)

    class Meta(SignalementListSerializer.Meta):
        fields = SignalementListSerializer.Meta.fields + [
            "before_photo",
            "after_photo",
            "position_source",
            "exif_latitude",
            "exif_longitude",
            "exif_taken_at",
            "position_discrepancy_m",
            "ai_summary",
            "ai_recommendation",
            "eco_score_impact",
            "fraud_flags",
            "authority_notes",
            "duplicate_of",
            "category",
            "province",
            "commune",
            "analysis",
            "status_history",
            "comments",
            "resolution_proofs",
        ]


class SignalementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signalement
        fields = [
            "title",
            "description",
            "photo",
            "latitude",
            "longitude",
            "gps_accuracy",
            "position_source",
            "category",
            "province",
            "commune",
            "address_text",
        ]

    def validate_description(self, value):
        if len(value.strip()) < 20:
            raise serializers.ValidationError("La description doit contenir au moins 20 caracteres.")
        if len(value) > 2000:
            raise serializers.ValidationError("La description ne doit pas depasser 2000 caracteres.")
        return value

    def validate_photo(self, photo):
        ext = os.path.splitext(photo.name)[1].lower()
        if ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
            raise serializers.ValidationError("Formats acceptes: JPG, PNG ou WEBP.")
        if photo.size > settings.FILE_UPLOAD_MAX_MEMORY_SIZE:
            raise serializers.ValidationError("La photo ne doit pas depasser 8 Mo.")
        return photo


class StatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Signalement.Status.choices)
    comment = serializers.CharField(required=False, allow_blank=True)


class AuthorityCommentCreateSerializer(serializers.Serializer):
    body = serializers.CharField()
    is_internal = serializers.BooleanField(default=False)


class ResolutionProofCreateSerializer(serializers.Serializer):
    after_photo = serializers.ImageField()
    comment = serializers.CharField()
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False)
