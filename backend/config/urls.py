from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import UserAdminViewSet
from apps.dashboard.views import CitizenDashboardView, MinistryDashboardView, AuthorityDashboardView
from apps.education.views import EducationalContentViewSet
from apps.locations.views import CommuneViewSet, ProvinceViewSet
from apps.notifications.views import NotificationViewSet
from apps.reports.views import ReportViewSet
from apps.signalements.views import CategoryViewSet, SignalementViewSet


router = DefaultRouter()
router.register("users", UserAdminViewSet, basename="user")
router.register("provinces", ProvinceViewSet, basename="province")
router.register("communes", CommuneViewSet, basename="commune")
router.register("categories", CategoryViewSet, basename="category")
router.register("signalements", SignalementViewSet, basename="signalement")
router.register("notifications", NotificationViewSet, basename="notification")
router.register("education", EducationalContentViewSet, basename="education")
router.register("reports", ReportViewSet, basename="report")

urlpatterns = [
    path("api/health/", lambda request: JsonResponse({"status": "ok", "service": "eco-rdc-api"}), name="api-health"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/ai/", include("apps.ai.urls")),
    path("api/alerts/", include("apps.alerts.urls")),
    path("api/locations/", include("apps.locations.urls")),
    path("api/signalements/", include("apps.signalements.urls")),
    path("api/education/", include("apps.education.urls")),
    path("api/publications/", include("apps.publications.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/reports/", include("apps.reports.urls")),
    path("api/dashboard/", include("apps.dashboard.urls")),
    path("api/dashboard/citoyen/", CitizenDashboardView.as_view(), name="dashboard-citoyen"),
    path("api/dashboard/autorite/", AuthorityDashboardView.as_view(), name="dashboard-autorite"),
    path("api/dashboard/ministere/", MinistryDashboardView.as_view(), name="dashboard-ministere"),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
