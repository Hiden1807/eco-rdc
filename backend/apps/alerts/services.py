from django.contrib.auth import get_user_model

from apps.notifications.models import Notification

from .models import OfficialAlert


User = get_user_model()


def publish_alert(user, validated_data):
    alert = OfficialAlert.objects.create(published_by=user, **validated_data)
    notify_alert_targets(alert)
    return alert


def notify_alert_targets(alert):
    users = User.objects.filter(is_active=True)
    if alert.commune_id:
        users = users.filter(commune_id=alert.commune_id) | User.objects.filter(role__in=["ministere", "admin"], is_active=True)
    elif alert.province_id:
        users = users.filter(province_id=alert.province_id) | User.objects.filter(role__in=["ministere", "admin"], is_active=True)
    for user in users.distinct()[:500]:
        Notification.objects.create(
            user=user,
            notification_type=Notification.Type.OFFICIAL_ALERT,
            title=alert.title,
            message=alert.message,
            payload={"alert_id": alert.id, "severity": alert.severity, "type": alert.alert_type},
        )

