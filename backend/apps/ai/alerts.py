"""Notifications intelligentes declenchees par ECO IA."""

from django.contrib.auth import get_user_model

from apps.ai.models import AINotificationRule
from apps.notifications.models import Notification


User = get_user_model()


def _recipients_for_signalement(signalement, roles):
    queryset = User.objects.filter(role__in=roles, is_active=True)
    if "autorite" in roles and signalement.commune_id:
        authority = queryset.filter(role="autorite", commune_id=signalement.commune_id)
        others = queryset.exclude(role="autorite")
        queryset = authority | others
    return queryset.exclude(id=signalement.created_by_id).distinct()[:80]


def send_ai_alerts(signalement, analyse_ia, prediction):
    """Cree les alertes IA en base sans interrompre le flux utilisateur."""

    gravity = (analyse_ia or {}).get("gravite") or signalement.gravity
    coherence = (analyse_ia or {}).get("coherence_image_description") or (analyse_ia or {}).get("coherence", "")
    duplicate_probability = int((analyse_ia or {}).get("duplicate_probability") or 0)
    risk_level = (prediction or {}).get("niveau_risque", "faible")
    photo_url = signalement.photo.url if signalement.photo else ""
    notifications = []
    triggered_rules = []

    if gravity == "critique":
        triggered_rules.append("cas_critique")
        for user in _recipients_for_signalement(signalement, ["autorite", "ministere", "admin"]):
            notifications.append(
                Notification(
                    user=user,
                    notification_type=Notification.Type.CRITICAL_CASE,
                    title="Alerte IA critique",
                    message=signalement.ai_summary or signalement.title,
                    payload={"signalement_id": signalement.id, "gravity": gravity, "source": "eco_ia", "photo": photo_url},
                )
            )

    if risk_level in {"eleve", "critique"}:
        triggered_rules.append("zone_risque")
        for user in _recipients_for_signalement(signalement, ["autorite", "ministere"]):
            notifications.append(
                Notification(
                    user=user,
                    notification_type=Notification.Type.RISK_ZONE,
                    title="Risque communal detecte par ECO IA",
                    message=(prediction or {}).get("recommandation", "Une commune necessite une surveillance prioritaire."),
                    payload={"signalement_id": signalement.id, "risk_level": risk_level, "source": "eco_ia", "photo": photo_url},
                )
            )

    if "incoherent" in coherence.lower() or "position_incoherente" in (analyse_ia or {}).get("fraud_flags", []):
        triggered_rules.append("verification_incoherence")
        flags = list(signalement.fraud_flags or [])
        if "verification_admin_requise" not in flags:
            flags.append("verification_admin_requise")
            signalement.fraud_flags = flags
            signalement.authority_notes = (signalement.authority_notes + "\n" if signalement.authority_notes else "") + "ECO IA recommande une verification administrative."
            signalement.save(update_fields=["fraud_flags", "authority_notes", "updated_at"])
        for user in _recipients_for_signalement(signalement, ["admin"]):
            notifications.append(
                Notification(
                    user=user,
                    notification_type=Notification.Type.AI_INCONSISTENCY,
                    title="Incoherence a verifier",
                    message=f"ECO IA demande une verification du signalement #{signalement.id}.",
                    payload={"signalement_id": signalement.id, "source": "eco_ia", "photo": photo_url},
                )
            )

    if signalement.is_probable_duplicate or duplicate_probability >= 60:
        triggered_rules.append("doublon_probable")
        for user in _recipients_for_signalement(signalement, ["autorite"]):
            notifications.append(
                Notification(
                    user=user,
                    notification_type=Notification.Type.RISK_ZONE,
                    title="Signalements similaires detectes",
                    message="ECO IA recommande une intervention groupee sur une situation recurrente.",
                    payload={"signalement_id": signalement.id, "duplicate_probability": duplicate_probability, "source": "eco_ia", "photo": photo_url},
                )
            )

    if notifications:
        Notification.objects.bulk_create(notifications)
        AINotificationRule.objects.bulk_create(
            [
                AINotificationRule(
                    rule_code=rule,
                    target_type="signalement",
                    target_id=str(signalement.id),
                    recipients_summary=f"{len(notifications)} notification(s) creee(s)",
                    payload={"gravity": gravity, "risk_level": risk_level, "duplicate_probability": duplicate_probability},
                )
                for rule in sorted(set(triggered_rules))
            ]
        )
    return {"created": len(notifications)}
