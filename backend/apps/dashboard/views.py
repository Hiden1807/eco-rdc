from collections import OrderedDict

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAuthorityMinistryOrAdmin, IsMinistryOrAdmin
from apps.locations.models import Commune
from apps.signalements.models import Signalement


def daily_counts(queryset, limit=60):
    """Agrege les dates en Python pour eviter la dependance aux tables timezone MySQL."""

    rows = OrderedDict()
    for created_at, status in queryset.values_list("created_at", "status").order_by("created_at"):
        day = timezone.localtime(created_at).date().isoformat()
        if day not in rows:
            rows[day] = {"day": day, "total": 0, "resolved": 0}
        rows[day]["total"] += 1
        if status == "resolu":
            rows[day]["resolved"] += 1
    return list(rows.values())[-limit:]


class CitizenDashboardView(APIView):
    def get(self, request):
        queryset = Signalement.objects.filter(created_by=request.user)
        return Response(
            {
                "total": queryset.count(),
                "pending": queryset.filter(status="en_attente").count(),
                "in_progress": queryset.filter(status="en_cours").count(),
                "resolved": queryset.filter(status="resolu").count(),
                "latest": list(
                    queryset.values("id", "title", "status", "gravity", "created_at", "ai_summary").order_by("-created_at")[:6]
                ),
                "progress": {
                    "received": queryset.filter(status__in=["en_attente", "valide", "en_cours", "resolu"]).count(),
                    "processing": queryset.filter(status__in=["valide", "en_cours"]).count(),
                    "completed": queryset.filter(status="resolu").count(),
                },
            }
        )


class AuthorityDashboardView(APIView):
    permission_classes = [IsAuthorityMinistryOrAdmin]

    def get(self, request):
        queryset = Signalement.objects.all()
        if request.user.role == "autorite" and request.user.commune_id:
            queryset = queryset.filter(commune_id=request.user.commune_id)
        return Response(
            {
                "zone_total": queryset.count(),
                "critical": queryset.filter(gravity__in=["critique", "eleve"]).count(),
                "urgent_list": list(
                    queryset.filter(gravity__in=["critique", "eleve"])
                    .values("id", "title", "gravity", "status", "commune__name", "created_at")
                    .order_by("-created_at")[:10]
                ),
                "by_category": list(
                    queryset.values("detected_category_label").annotate(total=Count("id")).order_by("-total")[:8]
                ),
                "by_status": list(queryset.values("status").annotate(total=Count("id")).order_by("status")),
                "local_map": list(
                    queryset.exclude(latitude__isnull=True)
                    .values("id", "title", "latitude", "longitude", "gravity", "status", "detected_category_label", "commune__name", "province__name")[:300]
                ),
            }
        )


class MinistryDashboardView(APIView):
    permission_classes = [IsMinistryOrAdmin]

    def get(self, request):
        queryset = Signalement.objects.select_related("province", "commune", "category")
        daily = daily_counts(queryset)
        top_communes = (
            queryset.values("commune__name")
            .exclude(commune__name__isnull=True)
            .annotate(total=Count("id"), critical=Count("id", filter=Q(gravity="critique")))
            .order_by("-total")[:10]
        )
        return Response(
            {
                "national_total": queryset.count(),
                "critical": queryset.filter(gravity="critique").count(),
                "active": queryset.filter(status__in=["en_attente", "valide", "en_cours"]).count(),
                "resolved": queryset.filter(status="resolu").count(),
                "top_provinces": list(
                    queryset.values("province__name")
                    .exclude(province__name__isnull=True)
                    .annotate(total=Count("id"))
                    .order_by("-total")[:8]
                ),
                "top_communes": list(top_communes),
                "top_categories": list(
                    queryset.values("detected_category_label").annotate(total=Count("id")).order_by("-total")[:8]
                ),
                "evolution": daily,
                "eco_scores": list(
                    queryset.values("commune__name")
                    .exclude(commune__name__isnull=True)
                    .annotate(
                        incidents=Count("id"),
                        critical=Count("id", filter=Q(gravity="critique")),
                        resolved=Count("id", filter=Q(status="resolu")),
                    )
                    .order_by("-incidents")[:20]
                ),
                "recommendations": [
                    "Traiter les cas critiques sous 24 heures dans les communes les plus touchees.",
                    "Renforcer le curage preventif avant les fortes pluies.",
                    "Publier un rapport hebdomadaire par province pour accelerer la coordination.",
                ],
            }
        )


class PublicStatisticsView(APIView):
    """Statistiques publiques agregees, sans exposition de donnees sensibles."""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        queryset = Signalement.objects.select_related("commune", "category")
        daily = daily_counts(queryset)
        top_categories = (
            queryset.values("detected_category_label")
            .annotate(total=Count("id"))
            .order_by("-total")[:8]
        )
        zones = (
            queryset.values("commune__name")
            .exclude(commune__name__isnull=True)
            .annotate(
                incidents=Count("id"),
                critical=Count("id", filter=Q(gravity__in=["critique", "eleve"])),
                resolved=Count("id", filter=Q(status="resolu")),
            )
            .order_by("-critical", "-incidents")[:20]
        )
        return Response(
            {
                "total": queryset.count(),
                "critical": queryset.filter(gravity__in=["critique", "eleve"]).count(),
                "active": queryset.filter(status__in=["en_attente", "valide", "en_cours"]).count(),
                "resolved": queryset.filter(status="resolu").count(),
                "communes_count": Commune.objects.count(),
                "evolution": daily,
                "top_categories": list(top_categories),
                "risk_zones": list(zones),
            }
        )
