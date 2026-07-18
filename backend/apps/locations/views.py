from rest_framework import permissions, viewsets

from apps.accounts.permissions import IsAdminRole

from .models import Commune, Province
from .serializers import CommuneSerializer, ProvinceSerializer


class ProvinceViewSet(viewsets.ModelViewSet):
    queryset = Province.objects.all()
    serializer_class = ProvinceSerializer
    search_fields = ["name", "code"]
    ordering_fields = ["name", "ecological_score"]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsAdminRole()]
        return [permissions.AllowAny()]


class CommuneViewSet(viewsets.ModelViewSet):
    queryset = Commune.objects.select_related("province").all()
    serializer_class = CommuneSerializer
    filterset_fields = ["province", "risk_level"]
    search_fields = ["name", "code", "province__name"]
    ordering_fields = ["name", "ecological_score", "risk_level"]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsAdminRole()]
        return [permissions.AllowAny()]
