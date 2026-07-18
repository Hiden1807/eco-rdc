from io import BytesIO

from django.core.files.base import ContentFile
from openpyxl import Workbook

from apps.signalements.models import Signalement


def build_signalements_excel(report):
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Signalements"
    sheet.append(["ID", "Titre", "Commune", "Categorie", "Gravite", "Statut", "Score IA"])
    for item in Signalement.objects.select_related("commune", "category").order_by("-created_at")[:1000]:
        sheet.append(
            [
                item.id,
                item.title,
                item.commune.name if item.commune else "",
                item.detected_category_label or (item.category.name if item.category else ""),
                item.gravity,
                item.status,
                item.ai_score,
            ]
        )
    buffer = BytesIO()
    workbook.save(buffer)
    filename = f"eco-rdc-{report.report_type}-{report.id}.xlsx"
    report.pdf.save(filename, ContentFile(buffer.getvalue()), save=True)
    return report

