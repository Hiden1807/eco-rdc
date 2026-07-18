from rest_framework import serializers

from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(source="generated_by.get_full_name", read_only=True)

    class Meta:
        model = Report
        fields = [
            "id",
            "title",
            "report_type",
            "summary",
            "statistics",
            "major_incidents",
            "recommendations",
            "chart_payload",
            "pdf",
            "generated_by_name",
            "generated_at",
        ]


class ReportGenerateSerializer(serializers.Serializer):
    report_type = serializers.ChoiceField(choices=Report.ReportType.choices)
    title = serializers.CharField(required=False, allow_blank=True)
