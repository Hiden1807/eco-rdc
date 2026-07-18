from django.db.models import Count

from apps.locations.models import Commune
from apps.signalements.models import Signalement


def get_user_role(user) -> str:
    role = getattr(user, "role", "") or "citoyen"
    return role if role in {"citoyen", "autorite", "ministere", "admin"} else "citoyen"


def user_territory(user) -> dict:
    return {
        "commune_id": getattr(user, "commune_id", None),
        "commune": getattr(getattr(user, "commune", None), "name", None),
        "province_id": getattr(user, "province_id", None),
        "province": getattr(getattr(user, "province", None), "name", None),
    }


def scoped_signalements_queryset(user):
    role = get_user_role(user)
    queryset = Signalement.objects.select_related("commune", "province", "category", "created_by")
    is_demo = getattr(user, "is_demo_ai", False)
    if role == "citoyen" and not is_demo:
        queryset = queryset.filter(created_by=user)
    elif role == "autorite" and getattr(user, "commune_id", None):
        queryset = queryset.filter(commune_id=user.commune_id)
    elif role == "autorite" and is_demo:
        queryset = queryset.filter(commune__name__in=["Barumbu", "Limete", "Masina"])
    return queryset


def build_relevant_context(user, *, intent: str, question: str = "", page_context: str = "") -> dict:
    """Assemble le contexte base de donnees que l'assistant peut citer.

    Les donnees sont toujours limitees au role connecte: un citoyen voit ses
    propres signalements, une autorite voit sa commune et le ministere/admin
    peuvent analyser l'ensemble de la plateforme.
    """

    role = get_user_role(user)
    queryset = scoped_signalements_queryset(user)
    total = queryset.count()
    resolved = queryset.filter(status="resolu").count()

    context = {
        "role": role,
        "territory": user_territory(user),
        "page_context": page_context,
        "question": question,
        "counts": {
            "total": total,
            "critical": queryset.filter(gravity="critique").count(),
            "active": queryset.filter(status__in=["en_attente", "valide", "en_cours"]).count(),
            "resolved": resolved,
            "duplicates": queryset.filter(is_probable_duplicate=True).count(),
            "resolution_rate": round((resolved / total) * 100, 2) if total else 0,
        },
    }

    if intent in {"statistics_query", "comparison_query", "geographic_query", "risk_query", "prediction_query", "recommendation_query"}:
        context["top_communes"] = list(
            queryset.values("commune__name")
            .exclude(commune__name__isnull=True)
            .annotate(total=Count("id"))
            .order_by("-total")[:6]
        )
        context["top_categories"] = list(
            queryset.values("detected_category_label")
            .annotate(total=Count("id"))
            .order_by("-total")[:6]
        )
        risk_zones = Commune.objects.order_by("ecological_score")
        if role in {"citoyen", "autorite"} and getattr(user, "commune_id", None):
            risk_zones = risk_zones.filter(id=user.commune_id)
        context["risk_zones"] = list(risk_zones.values("name", "risk_level", "ecological_score")[:6])

    if intent in {"statistics_query", "report_query", "risk_query", "prediction_query", "recommendation_query"}:
        context["recent_signalements"] = list(
            queryset.values("id", "title", "status", "gravity", "commune__name", "created_at", "ai_summary")
            .order_by("-created_at")[:8]
        )

    if intent in {"risk_query", "prediction_query", "recommendation_query", "report_query", "alert_query"}:
        from apps.ai.predictive import predictive_briefing
        from apps.ai.risk_predictor import predict_risk

        commune_id = getattr(user, "commune_id", None) if role in {"citoyen", "autorite"} else None
        context["prediction"] = predict_risk(days=7, commune_id=commune_id)
        context["predictive_briefing"] = predictive_briefing(days=7)

    if intent in {"status_query", "signalement_help"}:
        context["open_cases"] = list(
            queryset.filter(status__in=["en_attente", "valide", "en_cours"])
            .values("id", "title", "status", "gravity", "commune__name", "created_at")
            .order_by("-created_at")[:8]
        )

    if intent == "report_query":
        try:
            from apps.reports.models import Report

            context["recent_reports"] = list(
                Report.objects.values("id", "title", "report_type", "summary", "generated_at")
                .order_by("-generated_at")[:5]
            )
        except Exception:  # noqa: BLE001
            context["recent_reports"] = []

    return context
