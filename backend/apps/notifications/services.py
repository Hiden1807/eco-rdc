from .models import Notification


def create_notification(user, notification_type, title, message, payload=None):
    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        payload=payload or {},
    )


def mark_all_read(user):
    return Notification.objects.filter(user=user, is_read=False).update(is_read=True)


def unread_count(user):
    return Notification.objects.filter(user=user, is_read=False).count()

