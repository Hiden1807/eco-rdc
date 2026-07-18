from datetime import date, datetime, time
from decimal import Decimal
from pathlib import Path
from uuid import UUID

from django.db.models import Model, QuerySet
from django.utils import timezone


def make_json_safe(value):
    """Convertit recursivement une valeur Python/Django en JSON stable.

    Les sorties IA, EXIF et payloads metier peuvent contenir des datetime,
    Decimal ou instances de modele. Les JSONField n'acceptent pas ces objets
    bruts avec l'encodeur standard de Django/MySQL.
    """

    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, datetime):
        if timezone.is_aware(value):
            value = timezone.localtime(value)
        return value.isoformat()
    if isinstance(value, (date, time)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, Path):
        return str(value)
    if isinstance(value, Model):
        return getattr(value, "pk", None)
    if isinstance(value, QuerySet):
        return [make_json_safe(item) for item in value]
    if isinstance(value, dict):
        return {str(key): make_json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [make_json_safe(item) for item in value]
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return str(value)
