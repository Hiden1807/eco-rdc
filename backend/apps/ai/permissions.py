"""AI endpoint permissions.

Production calls must be authenticated with JWT. A demo bypass exists only when
the server explicitly enables it in DEBUG mode, which prevents accidental public
AI consumption after deployment.
"""

from types import SimpleNamespace

from django.conf import settings
from rest_framework.permissions import BasePermission


DEMO_ROLES = {"citoyen", "autorite", "ministere", "admin"}


def demo_ai_enabled(request):
    role = request.headers.get("X-ECO-DEMO-ROLE", "").strip()
    return bool(settings.ALLOW_DEMO_AI and role in DEMO_ROLES)


def get_ai_request_user(request):
    if request.user and request.user.is_authenticated:
        return request.user
    role = request.headers.get("X-ECO-DEMO-ROLE", "citoyen").strip()
    return SimpleNamespace(
        id=0,
        role=role if role in DEMO_ROLES else "citoyen",
        commune_id=None,
        province_id=None,
        commune=None,
        province=None,
        organization="Session demo",
        is_demo_ai=True,
        is_authenticated=True,
    )


class IsAuthenticatedOrDemoAI(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated) or demo_ai_enabled(request)
