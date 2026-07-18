from django.db.models import Count, Q
from django.db.models.functions import TruncDay

from apps.locations.models import Commune
from apps.signalements.models import Signalement


def citizen_dashboard_payload(user):
    queryset = Signalement.objects.filter(created_by=user)
    return {
        "total": queryset.count(),
        "pending": queryset.filter(status="en_attente").count(),
        "in_progress": queryset.filter(status="en_cours").count(),
        "resolved": queryset.filter(status="resolu").count(),
        "latest": list(queryset.values("id", "title", "status", "gravity", "created_at", "ai_summary")[:6]),
    }


def authority_dashboard_payload(user):
    queryset = Signalement.objects.all()
    if user.role == "autorite" and user.commune_id:
        queryset = queryset.filter(commune_id=user.commune_id)
    return {
        "zone_total": queryset.count(),
        "critical": queryset.filter(gravity__in=["critique", "eleve"]).count(),
        "urgent_list": list(
            queryset.filter(gravity__in=["critique", "eleve"])
            .values("id", "title", "gravity", "status", "commune__name", "created_at")[:10]
        ),
        "by_category": list(queryset.values("detected_category_label").annotate(total=Count("id")).order_by("-total")[:8]),
        "by_status": list(queryset.values("status").annotate(total=Count("id")).order_by("status")),
    }


def ministry_dashboard_payload():
    queryset = Signalement.objects.select_related("province", "commune", "category")
    daily = (
        queryset.annotate(day=TruncDay("created_at"))
        .values("day")
        .annotate(total=Count("id"))
        .order_by("day")[:60]
    )
    return {
        "national_total": queryset.count(),
        "critical": queryset.filter(gravity="critique").count(),
        "active": queryset.filter(status__in=["en_attente", "valide", "en_cours"]).count(),
        "resolved": queryset.filter(status="resolu").count(),
        "top_communes": list(
            queryset.values("commune__name")
            .exclude(commune__name__isnull=True)
            .annotate(total=Count("id"), critical=Count("id", filter=Q(gravity="critique")))
            .order_by("-total")[:10]
        ),
        "risk_zones": list(Commune.objects.order_by("ecological_score").values("name", "risk_level", "ecological_score")[:10]),
        "evolution": list(daily),
    }

