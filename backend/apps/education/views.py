from django.utils import timezone
from django.db.models import Q
from rest_framework import permissions, viewsets

from apps.accounts.permissions import IsAuthorityMinistryOrAdmin

from .models import EducationalContent
from .serializers import EducationalContentSerializer


class EducationalContentViewSet(viewsets.ModelViewSet):
    serializer_class = EducationalContentSerializer
    filterset_fields = ["content_type", "topic", "target_commune", "is_ai_generated"]
    search_fields = ["title", "excerpt", "body", "topic"]
    ordering_fields = ["created_at", "topic"]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsAuthorityMinistryOrAdmin()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def get_queryset(self):
        queryset = EducationalContent.objects.select_related("target_commune", "author")
        user = self.request.user
        if user.is_authenticated and user.role in {"autorite", "ministere", "admin"}:
            if user.role == "autorite" and user.commune_id:
                return queryset.filter(Q(target_commune_id=user.commune_id) | Q(target_commune__isnull=True))
            return queryset
        return queryset.filter(is_published=True, status=EducationalContent.Status.PUBLISHED)

    def perform_create(self, serializer):
        status_value = serializer.validated_data.get("status", EducationalContent.Status.PUBLISHED)
        is_published = status_value == EducationalContent.Status.PUBLISHED
        serializer.save(
            author=self.request.user,
            approved_by=self.request.user if is_published else None,
            published_at=timezone.now() if is_published else None,
            is_published=is_published,
        )
