from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import permissions, serializers, viewsets

from apps.accounts.permissions import IsAuthorityMinistryOrAdmin
from apps.notifications.models import Notification

from .models import OfficialPublication
from .serializers import OfficialPublicationSerializer


User = get_user_model()


class OfficialPublicationViewSet(viewsets.ModelViewSet):
    serializer_class = OfficialPublicationSerializer
    filterset_fields = ["publication_type", "status", "province", "commune", "is_featured"]
    search_fields = ["title", "excerpt", "body", "scope_label"]
    ordering_fields = ["published_at", "created_at", "publication_type"]

    def get_queryset(self):
        queryset = OfficialPublication.objects.select_related("author", "province", "commune")
        user = self.request.user
        if user.is_authenticated and user.role in {"autorite", "ministere", "admin"}:
            if user.role == "autorite" and user.commune_id:
                queryset = queryset.filter(Q(commune_id=user.commune_id) | Q(commune__isnull=True))
            return queryset
        return queryset.filter(status=OfficialPublication.Status.PUBLISHED, is_public=True)

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsAuthorityMinistryOrAdmin()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        user = self.request.user
        publication_type = serializer.validated_data.get("publication_type")
        self._ensure_publication_type_allowed(user, publication_type)

        data = {"author": user}
        if serializer.validated_data.get("status", OfficialPublication.Status.PUBLISHED) == OfficialPublication.Status.PUBLISHED:
            data["published_at"] = timezone.now()
        if user.role == "autorite" and user.commune_id:
            data["commune_id"] = user.commune_id
            data["province_id"] = user.province_id
        if not serializer.validated_data.get("slug"):
            data["slug"] = self._unique_slug(serializer.validated_data["title"])
        publication = serializer.save(**data)
        self._notify_officials(publication)

    def perform_update(self, serializer):
        data = {}
        publication_type = serializer.validated_data.get("publication_type")
        if publication_type:
            self._ensure_publication_type_allowed(self.request.user, publication_type)
        if serializer.validated_data.get("status") == OfficialPublication.Status.PUBLISHED and not serializer.instance.published_at:
            data["published_at"] = timezone.now()
        serializer.save(**data)

    def _ensure_publication_type_allowed(self, user, publication_type):
        if publication_type in {
            OfficialPublication.PublicationType.COMMUNIQUE,
            OfficialPublication.PublicationType.RAPPORT_PUBLIC,
        } and user.role not in {"ministere", "admin"}:
            raise serializers.ValidationError({"publication_type": "Reserve au ministere ou a l'administration."})

    def _unique_slug(self, title):
        max_length = OfficialPublication._meta.get_field("slug").max_length or 50
        base = slugify(title)[:max_length] or "publication"
        slug = base
        index = 2
        while OfficialPublication.objects.filter(slug=slug).exists():
            suffix = f"-{index}"
            slug = f"{base[: max_length - len(suffix)]}{suffix}"
            index += 1
        return slug

    def _notify_officials(self, publication):
        if publication.status != OfficialPublication.Status.PUBLISHED:
            return
        users = User.objects.filter(role__in=["admin", "ministere"]).exclude(id=self.request.user.id)[:50]
        Notification.objects.bulk_create(
            [
                Notification(
                    user=user,
                    notification_type=Notification.Type.EDUCATION_CONTENT,
                    title="Nouvelle publication officielle",
                    message=publication.title,
                    payload={"publication_id": publication.id, "type": publication.publication_type},
                )
                for user in users
            ]
        )
