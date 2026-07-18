from rest_framework.routers import DefaultRouter

from .views import OfficialAlertViewSet


router = DefaultRouter()
router.register("", OfficialAlertViewSet, basename="official-alert")

urlpatterns = router.urls

