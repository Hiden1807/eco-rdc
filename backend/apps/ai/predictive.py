from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone

from apps.locations.models import Commune
from apps.signalements.models import Signalement


def score_commune_risk(commune, metrics):
    """
    Compute a stable operational risk score for a commune.

    The score intentionally mixes historical pressure, recent acceleration,
    unresolved workload and the ecological baseline. This makes the AI useful
    even before a paid model is available, and gives external LLMs grounded data.
    """
    ecological_pressure = 100 - int(commune.ecological_score or 70)
    incident_pressure = metrics.get("total", 0) * 4
    critical_pressure = metrics.get("critical", 0) * 16
    active_pressure = metrics.get("active", 0) * 6
    recent_pressure = metrics.get("recent", 0) * 10
    duplicate_pressure = metrics.get("duplicates", 0) * 5
    score = ecological_pressure + incident_pressure + critical_pressure + active_pressure + recent_pressure + duplicate_pressure
    return min(100, max(0, int(score)))


def predict_environmental_risk(days=7, limit=12):
    """
    Rank communes by predicted environmental pressure for the next horizon.

    This is a deterministic predictive layer: it does not pretend to be weather
    science, but it provides a reliable early-warning index from platform data.
    """
    now = timezone.now()
    recent_since = now - timedelta(days=days)
    rows = (
        Signalement.objects.values("commune_id")
        .exclude(commune_id__isnull=True)
        .annotate(
            total=Count("id"),
            critical=Count("id", filter=Q(gravity="critique")),
            active=Count("id", filter=Q(status__in=["en_attente", "valide", "en_cours"])),
            recent=Count("id", filter=Q(created_at__gte=recent_since)),
            duplicates=Count("id", filter=Q(is_probable_duplicate=True)),
        )
    )
    metrics_by_commune = {row["commune_id"]: row for row in rows}
    predictions = []
    for commune in Commune.objects.select_related("province"):
        metrics = metrics_by_commune.get(commune.id, {})
        score = score_commune_risk(commune, metrics)
        predictions.append(
            {
                "commune_id": commune.id,
                "commune": commune.name,
                "province": commune.province.name if commune.province_id else None,
                "risk_score": score,
                "risk_level": "critique" if score >= 78 else "eleve" if score >= 58 else "modere" if score >= 35 else "faible",
                "horizon_days": days,
                "drivers": {
                    "total": metrics.get("total", 0),
                    "critical": metrics.get("critical", 0),
                    "active": metrics.get("active", 0),
                    "recent": metrics.get("recent", 0),
                    "duplicates": metrics.get("duplicates", 0),
                    "ecological_score": commune.ecological_score,
                },
            }
        )
    return sorted(predictions, key=lambda item: item["risk_score"], reverse=True)[:limit]


def emerging_hotspots(days=3):
    """Return communes where fresh reports are growing fast enough to deserve attention."""
    since = timezone.now() - timedelta(days=days)
    rows = (
        Signalement.objects.values("commune__name")
        .exclude(commune__name__isnull=True)
        .filter(created_at__gte=since)
        .annotate(recent=Count("id"), critical=Count("id", filter=Q(gravity="critique")))
        .order_by("-critical", "-recent")[:8]
    )
    return list(rows)


def preventive_actions(predictions):
    """Translate risk predictions into concrete operational actions."""
    actions = []
    for item in predictions[:5]:
        if item["risk_level"] in {"critique", "eleve"}:
            actions.append(
                {
                    "commune": item["commune"],
                    "title": "Intervention preventive prioritaire",
                    "owner": "Autorite locale",
                    "deadline": "24-48 heures",
                    "reason": f"Score predictif {item['risk_score']} ({item['risk_level']}).",
                }
            )
    return actions


def predictive_briefing(days=7):
    """Build the predictive payload consumed by dashboards, reports and the assistant."""
    predictions = predict_environmental_risk(days=days)
    return {
        "horizon_days": days,
        "predictions": predictions,
        "hotspots": emerging_hotspots(),
        "preventive_actions": preventive_actions(predictions),
    }
