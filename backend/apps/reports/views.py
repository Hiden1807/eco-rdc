from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsMinistryOrAdmin
from apps.notifications.models import Notification

from .models import Report
from .serializers import ReportGenerateSerializer, ReportSerializer
from .services import generate_report


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.select_related("generated_by").all()
    serializer_class = ReportSerializer
    permission_classes = [IsMinistryOrAdmin]
    filterset_fields = ["report_type"]
    search_fields = ["title", "summary"]
    ordering_fields = ["generated_at", "report_type"]

    @action(detail=False, methods=["post"])
    def generate(self, request):
        serializer = ReportGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = generate_report(
            serializer.validated_data["report_type"],
            request.user,
            serializer.validated_data.get("title", ""),
        )
        Notification.objects.create(
            user=request.user,
            notification_type=Notification.Type.REPORT_AVAILABLE,
            title="Nouveau rapport disponible",
            message=report.summary,
            payload={"report_id": report.id, "pdf": report.pdf.url if report.pdf else ""},
        )
        return Response(ReportSerializer(report, context={"request": request}).data, status=201)

