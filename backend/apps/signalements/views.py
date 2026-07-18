from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminRole, IsAuthorityMinistryOrAdmin
from apps.ai.alerts import send_ai_alerts
from apps.ai.risk_predictor import predict_risk
from apps.ai.services import analyze_signalement, apply_ai_analysis
from apps.notifications.models import Notification

from .models import AuthorityComment, Category, ResolutionProof, Signalement, StatusHistory
from .serializers import (
    AuthorityCommentCreateSerializer,
    AuthorityCommentSerializer,
    CategorySerializer,
    ResolutionProofCreateSerializer,
    SignalementCreateSerializer,
    SignalementDetailSerializer,
    SignalementListSerializer,
    StatusUpdateSerializer,
)


User = get_user_model()


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    search_fields = ["name", "slug"]
    ordering_fields = ["name"]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsAdminRole()]
        return [permissions.AllowAny()]


class SignalementViewSet(viewsets.ModelViewSet):
    filterset_fields = ["status", "gravity", "category", "province", "commune", "is_probable_duplicate"]
    search_fields = ["title", "description", "ai_summary", "detected_category_label"]
    ordering_fields = ["created_at", "updated_at", "gravity", "ai_score"]

    def get_queryset(self):
        queryset = Signalement.objects.select_related(
            "created_by", "category", "province", "commune", "duplicate_of"
        ).prefetch_related("status_history", "comments")
        user = self.request.user
        if self.action in {"map", "risk_zones"}:
            return queryset.exclude(latitude__isnull=True).exclude(longitude__isnull=True)
        if not user.is_authenticated:
            return Signalement.objects.none()
        if user.role == "citoyen":
            return queryset.filter(created_by=user)
        if user.role == "autorite" and user.commune_id:
            return queryset.filter(commune_id=user.commune_id)
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return SignalementCreateSerializer
        if self.action == "list":
            return SignalementListSerializer
        return SignalementDetailSerializer

    def get_permissions(self):
        if self.action in {"map", "risk_zones"}:
            return [permissions.AllowAny()]
        if self.action in {"status", "resolve"}:
            return [IsAuthorityMinistryOrAdmin()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        signalement = serializer.save(created_by=request.user)
        StatusHistory.objects.create(signalement=signalement, new_status=signalement.status, changed_by=request.user)
        analysis = analyze_signalement(signalement)
        apply_ai_analysis(signalement, analysis)
        prediction = predict_risk(days=7, commune_id=signalement.commune_id) if signalement.commune_id else predict_risk(days=7)
        send_ai_alerts(signalement, analysis, prediction)
        ai_unavailable = analysis.get("_source") == "error"
        photo_url = request.build_absolute_uri(signalement.photo.url) if signalement.photo else ""
        Notification.objects.create(
            user=request.user,
            notification_type=Notification.Type.SIGNALEMENT_RECEIVED,
            title="Signalement recu",
            message=(
                "Votre signalement a ete enregistre. ECO IA est temporairement indisponible; une verification humaine est requise."
                if ai_unavailable
                else "Votre signalement a ete enregistre et analyse par ECO RDC Intelligence."
            ),
            payload={
                "signalement_id": signalement.id,
                "title": signalement.title,
                "status": signalement.status,
                "photo": photo_url,
            },
        )
        authority_users = User.objects.filter(role="autorite", is_active=True)
        if signalement.commune_id:
            authority_users = authority_users.filter(commune_id=signalement.commune_id)
        critical = signalement.gravity in {"critique", "eleve"}
        institutional_users = User.objects.filter(role__in=["admin", "ministere"], is_active=True)
        recipients = (authority_users | institutional_users).exclude(id=request.user.id).distinct()[:80]
        Notification.objects.bulk_create(
            [
                Notification(
                    user=recipient,
                    notification_type=Notification.Type.CRITICAL_CASE if critical else Notification.Type.SIGNALEMENT_RECEIVED,
                    title="Nouveau cas critique" if critical else "Nouveau signalement citoyen",
                    message=signalement.ai_summary or signalement.title,
                    payload={
                        "signalement_id": signalement.id,
                        "title": signalement.title,
                        "status": signalement.status,
                        "gravity": signalement.gravity,
                        "commune": signalement.commune.name if signalement.commune_id else "",
                        "ai_score": signalement.ai_score,
                        "photo": photo_url,
                    },
                )
                for recipient in recipients
            ]
        )
        output = SignalementDetailSerializer(signalement, context={"request": request}).data
        headers = self.get_success_headers(output)
        return Response(output, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=["post"], url_path="status")
    def status(self, request, pk=None):
        signalement = self.get_object()
        serializer = StatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_status = signalement.status
        new_status = serializer.validated_data["status"]
        signalement.status = new_status
        if new_status == Signalement.Status.RESOLU:
            signalement.resolved_at = timezone.now()
        signalement.save(update_fields=["status", "resolved_at", "updated_at"])
        StatusHistory.objects.create(
            signalement=signalement,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user,
            comment=serializer.validated_data.get("comment", ""),
        )
        notification_type = {
            Signalement.Status.VALIDE: Notification.Type.SIGNALEMENT_VALIDATED,
            Signalement.Status.EN_COURS: Notification.Type.SIGNALEMENT_IN_PROGRESS,
            Signalement.Status.RESOLU: Notification.Type.SIGNALEMENT_RESOLVED,
            Signalement.Status.REJETE: Notification.Type.SIGNALEMENT_REJECTED,
        }.get(new_status, Notification.Type.SIGNALEMENT_RECEIVED)
        Notification.objects.create(
            user=signalement.created_by,
            notification_type=notification_type,
            title=f"Statut mis a jour: {new_status}",
            message=serializer.validated_data.get("comment", "") or "Votre signalement a change de statut.",
            payload={"signalement_id": signalement.id, "status": new_status},
        )
        return Response(SignalementDetailSerializer(signalement, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def comment(self, request, pk=None):
        signalement = self.get_object()
        serializer = AuthorityCommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = dict(serializer.validated_data)
        if request.user.role == "citoyen":
            payload["is_internal"] = False
        comment = AuthorityComment.objects.create(signalement=signalement, author=request.user, **payload)
        return Response(AuthorityCommentSerializer(comment).data, status=201)

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        signalement = self.get_object()
        serializer = ResolutionProofCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        after_photo = serializer.validated_data["after_photo"]
        signalement.after_photo = after_photo
        signalement.status = Signalement.Status.RESOLU
        signalement.resolved_at = timezone.now()
        signalement.save()
        ResolutionProof.objects.create(
            signalement=signalement,
            photo=after_photo,
            comment=serializer.validated_data["comment"],
            resolved_by=request.user,
            latitude=serializer.validated_data.get("latitude"),
            longitude=serializer.validated_data.get("longitude"),
        )
        StatusHistory.objects.create(
            signalement=signalement,
            old_status=Signalement.Status.EN_COURS,
            new_status=Signalement.Status.RESOLU,
            changed_by=request.user,
            comment=serializer.validated_data["comment"],
        )
        return Response(SignalementDetailSerializer(signalement, context={"request": request}).data)

    @action(detail=False, methods=["get"])
    def map(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        data = [
            {
                "id": item.id,
                "title": item.title,
                "category": item.detected_category_label or (item.category.name if item.category else ""),
                "gravity": item.gravity,
                "status": item.status,
                "latitude": item.latitude,
                "longitude": item.longitude,
                "commune": item.commune.name if item.commune else "",
                "province": item.province.name if item.province else "",
                "address_text": item.address_text,
                "photo": request.build_absolute_uri(item.photo.url) if item.photo else "",
                "summary": item.ai_summary,
                "recommendation": item.ai_recommendation,
                "created_at": item.created_at,
            }
            for item in queryset[:1000]
        ]
        return Response(data)

    @action(detail=False, methods=["get"], url_path="risk-zones")
    def risk_zones(self, request):
        zones = (
            self.get_queryset()
            .values("commune__id", "commune__name")
            .exclude(commune__isnull=True)
            .annotate(
                total=Count("id"),
                critical=Count("id", filter=Q(gravity="critique")),
                active=Count("id", filter=Q(status__in=["en_attente", "valide", "en_cours"])),
            )
            .order_by("-critical", "-active", "-total")[:25]
        )
        return Response(list(zones))
