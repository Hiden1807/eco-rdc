from django.urls import path

from .views import AuthorityDashboardView, CitizenDashboardView, MinistryDashboardView, PublicStatisticsView


urlpatterns = [
    path("citoyen/", CitizenDashboardView.as_view(), name="dashboard-citoyen"),
    path("autorite/", AuthorityDashboardView.as_view(), name="dashboard-autorite"),
    path("ministere/", MinistryDashboardView.as_view(), name="dashboard-ministere"),
    path("public/", PublicStatisticsView.as_view(), name="dashboard-public"),
]
