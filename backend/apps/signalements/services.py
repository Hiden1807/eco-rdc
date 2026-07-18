from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone

from apps.ai.services import analyze_signalement, apply_ai_analysis
from apps.notifications.models import Notification

from .models import Signalement, StatusHistory


User = get_user_model()


def get_signalements_for_user(user):
    queryset = Signalement.objects.select_related("created_by", "category", "province", "commune", "duplicate_of")
    if not user.is_authenticated:
        return Signalement.objects.none()
    if user.role == "citoyen":
        return queryset.filter(created_by=user)
    if user.role == "autorite" and user.commune_id:
        return queryset.filter(commune_id=user.commune_id)
    return queryset


def create_intelligent_signalement(user, validated_data):
    signalement = Signalement.objects.create(created_by=user, **validated_data)
    StatusHistory.objects.create(signalement=signalement, new_status=signalement.status, changed_by=user)
    analysis = analyze_signalement(signalement)
    apply_ai_analysis(signalement, analysis)
    notify_signalement_created(signalement)
    return signalement


def update_status(signalement, status, changed_by, comment=""):
    old_status = signalement.status
    signalement.status = status
    if status == Signalement.Status.RESOLU:
        signalement.resolved_at = timezone.now()
    signalement.save(update_fields=["status", "resolved_at", "updated_at"])
    StatusHistory.objects.create(
        signalement=signalement,
        old_status=old_status,
        new_status=status,
        changed_by=changed_by,
        comment=comment,
    )
    notify_status_changed(signalement, comment)
    return signalement


def notify_signalement_created(signalement):
    photo_url = signalement.photo.url if signalement.photo else ""
    Notification.objects.create(
        user=signalement.created_by,
        notification_type=Notification.Type.SIGNALEMENT_RECEIVED,
        title="Signalement recu",
        message="Votre signalement a ete enregistre et analyse par ECO RDC Intelligence.",
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
    institutional_users = User.objects.filter(role__in=["admin", "ministere"], is_active=True)
    critical = signalement.gravity in {"critique", "eleve"}
    recipients = (authority_users | institutional_users).exclude(Q(id=signalement.created_by_id)).distinct()[:80]
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


def notify_status_changed(signalement, comment=""):
    notification_type = {
        Signalement.Status.VALIDE: Notification.Type.SIGNALEMENT_VALIDATED,
        Signalement.Status.EN_COURS: Notification.Type.SIGNALEMENT_IN_PROGRESS,
        Signalement.Status.RESOLU: Notification.Type.SIGNALEMENT_RESOLVED,
        Signalement.Status.REJETE: Notification.Type.SIGNALEMENT_REJECTED,
    }.get(signalement.status, Notification.Type.SIGNALEMENT_RECEIVED)
    Notification.objects.create(
        user=signalement.created_by,
        notification_type=notification_type,
        title=f"Statut mis a jour: {signalement.status}",
        message=comment or "Votre signalement a change de statut.",
        payload={"signalement_id": signalement.id, "status": signalement.status},
    )
