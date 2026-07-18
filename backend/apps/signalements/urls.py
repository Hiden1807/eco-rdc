from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, SignalementViewSet


router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="signalement-category")
router.register("signalements", SignalementViewSet, basename="signalement")

urlpatterns = router.urls

