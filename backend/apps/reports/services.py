from io import BytesIO
from statistics import mean

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.db.models import Count, Q
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from apps.ai.predictive import predictive_briefing
from apps.locations.models import Commune
from apps.signalements.models import Category, Signalement

from .models import Report


def _percent(part, total):
    return round((part / total) * 100, 2) if total else 0


def _period_scope(report_type):
    now = timezone.now()
    scopes = {
        Report.ReportType.DAILY: (now - timezone.timedelta(days=1), "24 dernieres heures"),
        Report.ReportType.WEEKLY: (now - timezone.timedelta(days=7), "7 derniers jours"),
        Report.ReportType.MONTHLY: (now - timezone.timedelta(days=30), "30 derniers jours"),
    }
    return scopes.get(report_type, (None, "ensemble de la plateforme"))


def _resolution_delay_hours(queryset):
    resolved = queryset.exclude(resolved_at__isnull=True).values_list("created_at", "resolved_at")
    durations = [
        max(0, (resolved_at - created_at).total_seconds() / 3600)
        for created_at, resolved_at in resolved
        if resolved_at and created_at
    ]
    return round(mean(durations), 2) if durations else 0


def _distribution(queryset, field, limit=10):
    return list(queryset.values(field).annotate(total=Count("id")).order_by("-total")[:limit])


def _human_label(value, fallback="Non renseigne"):
    return value or fallback


def build_report_payload(report_type):
    """Construit un rapport scientifique deterministe a partir des donnees reelles.

    Cette fonction remplace volontairement la generation IA pour les rapports:
    les chiffres, constats et recommandations proviennent exclusivement des
    tables de la plateforme et de l'indice predictif explicable.
    """

    since, period_label = _period_scope(report_type)
    queryset = Signalement.objects.select_related("commune", "province", "category", "created_by")
    if since:
        queryset = queryset.filter(created_at__gte=since)

    total = queryset.count()
    resolved = queryset.filter(status=Signalement.Status.RESOLU).count()
    active = queryset.filter(status__in=[Signalement.Status.EN_ATTENTE, Signalement.Status.VALIDE, Signalement.Status.EN_COURS]).count()
    critical = queryset.filter(gravity=Signalement.Gravity.CRITIQUE).count()
    high = queryset.filter(gravity=Signalement.Gravity.ELEVE).count()
    rejected = queryset.filter(status=Signalement.Status.REJETE).count()
    duplicate = queryset.filter(is_probable_duplicate=True).count()
    geolocated = queryset.exclude(latitude__isnull=True).exclude(longitude__isnull=True).count()
    with_ai_summary = queryset.exclude(ai_summary="").count()
    categories_count = Category.objects.count()
    communes_count = Commune.objects.count()
    User = get_user_model()
    users_by_role = list(User.objects.values("role").annotate(total=Count("id")).order_by("role"))

    stats = {
        "periode": period_label,
        "total_signalements": total,
        "signalements_actifs": active,
        "signalements_resolus": resolved,
        "signalements_rejetes": rejected,
        "cas_critiques": critical,
        "cas_eleves": high,
        "doublons_probables": duplicate,
        "signalements_geolocalises": geolocated,
        "signalements_avec_analyse": with_ai_summary,
        "taux_resolution": _percent(resolved, total),
        "taux_geolocalisation": _percent(geolocated, total),
        "taux_cas_critiques": _percent(critical, total),
        "delai_moyen_resolution_heures": _resolution_delay_hours(queryset),
        "communes_referencees": communes_count,
        "categories_referencees": categories_count,
    }

    major_incidents = list(
        queryset.filter(Q(gravity=Signalement.Gravity.CRITIQUE) | Q(gravity=Signalement.Gravity.ELEVE))
        .values("title", "gravity", "status", "commune__name", "province__name", "created_at", "ai_summary")
        .order_by("-created_at")[:10]
    )

    categories = list(
        queryset.values("detected_category_label", "category__name")
        .annotate(total=Count("id"))
        .order_by("-total")[:8]
    )
    communes = list(
        queryset.values("commune__name")
        .exclude(commune__name__isnull=True)
        .annotate(
            total=Count("id"),
            critiques=Count("id", filter=Q(gravity=Signalement.Gravity.CRITIQUE)),
            actifs=Count("id", filter=Q(status__in=[Signalement.Status.EN_ATTENTE, Signalement.Status.VALIDE, Signalement.Status.EN_COURS])),
            resolus=Count("id", filter=Q(status=Signalement.Status.RESOLU)),
        )
        .order_by("-total")[:10]
    )
    status_distribution = _distribution(queryset, "status")
    gravity_distribution = _distribution(queryset, "gravity")
    predictive = predictive_briefing(days=7)

    recommendations = [
        "Prioriser les signalements critiques et eleves avant les interventions ordinaires.",
        "Verifier systematiquement la photo, la position GPS et la commune avant toute decision administrative.",
        "Actualiser les statuts des dossiers actifs pour ameliorer le suivi citoyen et le taux de resolution.",
        "Exploiter les communes recurrentes comme points de depart des operations preventives.",
    ]
    if communes:
        recommendations.append(f"Concentrer la premiere vague de controle sur {_human_label(communes[0].get('commune__name'))}, commune la plus signalee sur la periode.")
    if categories:
        dominant = categories[0].get("detected_category_label") or categories[0].get("category__name")
        recommendations.append(f"Preparer une action de sensibilisation ciblee sur la categorie dominante: {_human_label(dominant)}.")
    recommendations.extend(
        f"{item['commune']}: {item['reason']} Delai {item['deadline']}."
        for item in predictive.get("preventive_actions", [])[:3]
    )

    summary = (
        f"Rapport {report_type} genere le {timezone.localtime().strftime('%d/%m/%Y a %H:%M')}. "
        f"Periode analysee: {period_label}. {total} signalement(s) exploite(s), "
        f"{critical} critique(s), {active} actif(s), taux de resolution {stats['taux_resolution']}%."
    )

    return summary, stats, major_incidents, recommendations, {
        "categories": categories,
        "communes": communes,
        "status_distribution": status_distribution,
        "gravity_distribution": gravity_distribution,
        "users_by_role": users_by_role,
        "predictive": predictive,
        "methodologie": [
            "Extraction des signalements selon la periode demandee.",
            "Agregation par statut, gravite, commune et categorie.",
            "Calcul des taux operationnels et du delai moyen de resolution.",
            "Classement predictif deterministe base sur frequence, gravite, activite recente et pression ecologique.",
        ],
    }


def attach_pdf(report):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, title=report.title)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("ECO RDC Intelligence", styles["Title"]),
        Paragraph(report.title, styles["Heading2"]),
        Paragraph("Rapport institutionnel genere sans IA generative", styles["Heading3"]),
        Paragraph(report.summary, styles["BodyText"]),
        Spacer(1, 16),
    ]
    stat_rows = [["Indicateur", "Valeur"]] + [[key, value] for key, value in report.statistics.items()]
    table = Table(stat_rows, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f766e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("PADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 16))

    methodologie = report.chart_payload.get("methodologie") or []
    if methodologie:
        story.append(Paragraph("Methodologie", styles["Heading3"]))
        for item in methodologie:
            story.append(Paragraph(f"- {item}", styles["BodyText"]))
        story.append(Spacer(1, 12))

    story.append(Paragraph("Recommandations", styles["Heading3"]))
    for item in report.recommendations:
        story.append(Paragraph(f"- {item}", styles["BodyText"]))
    if report.major_incidents:
        story.append(Spacer(1, 16))
        story.append(Paragraph("Incidents majeurs recents", styles["Heading3"]))
        incident_rows = [["Titre", "Gravite", "Statut", "Commune"]]
        for item in report.major_incidents[:8]:
            incident_rows.append(
                [
                    item.get("title", "")[:42],
                    item.get("gravity", ""),
                    item.get("status", ""),
                    item.get("commune__name") or "",
                ]
            )
        incident_table = Table(incident_rows, hAlign="LEFT")
        incident_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#166534")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("PADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(incident_table)
    categories = report.chart_payload.get("categories") or []
    if categories:
        story.append(Spacer(1, 16))
        story.append(Paragraph("Categories dominantes", styles["Heading3"]))
        for item in categories[:6]:
            label = item.get("detected_category_label") or item.get("category__name") or "Non classe"
            story.append(Paragraph(f"- {label}: {item.get('total', 0)} cas", styles["BodyText"]))

    communes = report.chart_payload.get("communes") or []
    if communes:
        story.append(Spacer(1, 16))
        story.append(Paragraph("Communes les plus signalees", styles["Heading3"]))
        commune_rows = [["Commune", "Total", "Critiques", "Actifs", "Resolus"]]
        for item in communes[:8]:
            commune_rows.append(
                [
                    item.get("commune__name") or "Non renseignee",
                    item.get("total", 0),
                    item.get("critiques", 0),
                    item.get("actifs", 0),
                    item.get("resolus", 0),
                ]
            )
        commune_table = Table(commune_rows, hAlign="LEFT")
        commune_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f766e")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("PADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(commune_table)

    predictions = (report.chart_payload.get("predictive") or {}).get("predictions") or []
    if predictions:
        story.append(Spacer(1, 16))
        story.append(Paragraph("Priorites predictives deterministes", styles["Heading3"]))
        for item in predictions[:5]:
            story.append(
                Paragraph(
                    f"- {item.get('commune')}: score {item.get('risk_score')} ({item.get('risk_level')})",
                    styles["BodyText"],
                )
            )
    doc.build(story)
    filename = f"eco-rdc-{report.report_type}-{report.id}.pdf"
    report.pdf.save(filename, ContentFile(buffer.getvalue()), save=True)
    return report


def generate_report(report_type, user, title=""):
    summary, stats, incidents, recommendations, chart_payload = build_report_payload(report_type)
    report = Report.objects.create(
        title=title or f"Rapport {report_type} ECO RDC",
        report_type=report_type,
        summary=summary,
        statistics=stats,
        major_incidents=incidents,
        recommendations=recommendations,
        chart_payload=chart_payload,
        generated_by=user,
    )
    return attach_pdf(report)
