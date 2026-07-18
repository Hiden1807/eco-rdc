from rest_framework.routers import DefaultRouter

from .views import EducationalContentViewSet


router = DefaultRouter()
router.register("", EducationalContentViewSet, basename="education")

urlpatterns = router.urls

