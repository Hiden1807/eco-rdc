from rest_framework.routers import DefaultRouter

from .views import CommuneViewSet, ProvinceViewSet


router = DefaultRouter()
router.register("provinces", ProvinceViewSet, basename="location-province")
router.register("communes", CommuneViewSet, basename="location-commune")

urlpatterns = router.urls

