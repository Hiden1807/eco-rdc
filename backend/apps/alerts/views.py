from django.db import models
from django.utils import timezone
from rest_framework import permissions, viewsets

from apps.accounts.permissions import IsAuthorityMinistryOrAdmin

from .models import OfficialAlert
from .serializers import OfficialAlertSerializer
from .services import publish_alert


class OfficialAlertViewSet(viewsets.ModelViewSet):
    serializer_class = OfficialAlertSerializer
    filterset_fields = ["alert_type", "severity", "province", "commune", "is_active"]
    search_fields = ["title", "message"]
    ordering_fields = ["starts_at", "created_at", "severity"]

    def get_queryset(self):
        queryset = OfficialAlert.objects.select_related("province", "commune", "published_by")
        if self.request.user.is_authenticated and self.request.user.role in {"autorite", "citoyen"}:
            if self.request.user.commune_id:
                queryset = queryset.filter(commune_id__in=[self.request.user.commune_id, None])
        if self.request.query_params.get("active") == "true":
            now = timezone.now()
            queryset = queryset.filter(is_active=True, starts_at__lte=now).filter(
                models.Q(ends_at__isnull=True) | models.Q(ends_at__gte=now)
            )
        return queryset.distinct()

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsAuthorityMinistryOrAdmin()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        alert = publish_alert(self.request.user, serializer.validated_data)
        serializer.instance = alert
