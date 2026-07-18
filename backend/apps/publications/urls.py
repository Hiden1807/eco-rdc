from rest_framework.routers import DefaultRouter

from .views import OfficialPublicationViewSet


router = DefaultRouter()
router.register("", OfficialPublicationViewSet, basename="official-publication")

urlpatterns = router.urls
