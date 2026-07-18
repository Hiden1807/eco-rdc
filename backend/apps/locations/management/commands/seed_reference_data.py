from django.core.management.base import BaseCommand

from apps.locations.models import Commune, Province
from apps.publications.models import OfficialPublication
from apps.signalements.models import Category


KINSHASA_COMMUNES = [
    {"name": "Bandalungwa", "code": "KIN-BANDALUNGWA", "lat": "-4.3446000", "lng": "15.2877000", "score": 66, "risk": "eleve"},
    {"name": "Gombe", "code": "KIN-GOMBE", "lat": "-4.3050000", "lng": "15.3120000", "score": 78, "risk": "modere"},
    {"name": "Limete", "code": "KIN-LIMETE", "lat": "-4.3550000", "lng": "15.3470000", "score": 64, "risk": "eleve"},
    {"name": "Barumbu", "code": "KIN-BARUMBU", "lat": "-4.3240000", "lng": "15.3270000", "score": 52, "risk": "critique"},
    {"name": "Bumbu", "code": "KIN-BUMBU", "lat": "-4.3598000", "lng": "15.3005000", "score": 55, "risk": "eleve"},
    {"name": "Kasa-Vubu", "code": "KIN-KASA-VUBU", "lat": "-4.3363000", "lng": "15.3008000", "score": 63, "risk": "eleve"},
    {"name": "Kimbanseke", "code": "KIN-KIMBANSEKE", "lat": "-4.4230000", "lng": "15.4050000", "score": 50, "risk": "critique"},
    {"name": "Kinshasa", "code": "KIN-KINSHASA", "lat": "-4.3317000", "lng": "15.3139000", "score": 62, "risk": "eleve"},
    {"name": "Kintambo", "code": "KIN-KINTAMBO", "lat": "-4.3320000", "lng": "15.2680000", "score": 67, "risk": "modere"},
    {"name": "Ngaliema", "code": "KIN-NGALIEMA", "lat": "-4.3840000", "lng": "15.2250000", "score": 69, "risk": "eleve"},
    {"name": "Masina", "code": "KIN-MASINA", "lat": "-4.3830000", "lng": "15.3910000", "score": 58, "risk": "critique"},
    {"name": "Kalamu", "code": "KIN-KALAMU", "lat": "-4.3450000", "lng": "15.3180000", "score": 72, "risk": "modere"},
    {"name": "Kisenso", "code": "KIN-KISENSO", "lat": "-4.4180000", "lng": "15.3460000", "score": 47, "risk": "critique"},
    {"name": "Lemba", "code": "KIN-LEMBA", "lat": "-4.3970000", "lng": "15.3220000", "score": 68, "risk": "modere"},
    {"name": "Lingwala", "code": "KIN-LINGWALA", "lat": "-4.3215000", "lng": "15.2982000", "score": 61, "risk": "eleve"},
    {"name": "Makala", "code": "KIN-MAKALA", "lat": "-4.3725000", "lng": "15.3081000", "score": 54, "risk": "eleve"},
    {"name": "Maluku", "code": "KIN-MALUKU", "lat": "-4.0490000", "lng": "16.0830000", "score": 82, "risk": "faible"},
    {"name": "Matete", "code": "KIN-MATETE", "lat": "-4.3835000", "lng": "15.3472000", "score": 59, "risk": "eleve"},
    {"name": "Mont-Ngafula", "code": "KIN-MONT-NGAFULA", "lat": "-4.4280000", "lng": "15.2550000", "score": 57, "risk": "critique"},
    {"name": "Ndjili", "code": "KIN-NDJILI", "lat": "-4.3990000", "lng": "15.3780000", "score": 56, "risk": "critique"},
    {"name": "Ngaba", "code": "KIN-NGABA", "lat": "-4.3790000", "lng": "15.3200000", "score": 60, "risk": "eleve"},
    {"name": "Ngiri-Ngiri", "code": "KIN-NGIRI-NGIRI", "lat": "-4.3412000", "lng": "15.2898000", "score": 58, "risk": "eleve"},
    {"name": "Nsele", "code": "KIN-NSELE", "lat": "-4.3160000", "lng": "15.5000000", "score": 81, "risk": "faible"},
    {"name": "Selembao", "code": "KIN-SELEMBAO", "lat": "-4.3820000", "lng": "15.2850000", "score": 55, "risk": "eleve"},
]

CATEGORIES = [
    {"name": "Dechets", "slug": "dechets", "color": "#16a34a", "icon": "Trash2"},
    {"name": "Inondation", "slug": "inondation", "color": "#2563eb", "icon": "Waves"},
    {"name": "Erosion", "slug": "erosion", "color": "#b45309", "icon": "Mountain"},
    {"name": "Pollution d'eau", "slug": "pollution-eau", "color": "#0891b2", "icon": "Droplets"},
    {"name": "Caniveau bouche", "slug": "caniveau-bouche", "color": "#475569", "icon": "Construction"},
    {"name": "Deforestation", "slug": "deforestation", "color": "#15803d", "icon": "Trees"},
    {"name": "Pollution de l'air", "slug": "pollution-air", "color": "#7c3aed", "icon": "Cloud"},
    {"name": "Autre incident", "slug": "autre", "color": "#0f766e", "icon": "Leaf"},
]

PUBLICATIONS = [
    {
        "title": "Prevenir les inondations avant les fortes pluies",
        "slug": "prevenir-les-inondations-avant-les-fortes-pluies",
        "publication_type": OfficialPublication.PublicationType.EDUCATION,
        "excerpt": "Identifier les drains sensibles, eviter les dechets dans les caniveaux et signaler rapidement les points d'eau stagnante.",
        "body": "Les citoyens doivent maintenir les caniveaux libres, signaler les obstructions et suivre les alertes officielles de leur commune.",
        "scope_label": "Kinshasa",
        "is_featured": True,
    },
    {
        "title": "Communique officiel sur la gestion des dechets",
        "slug": "communique-officiel-sur-la-gestion-des-dechets",
        "publication_type": OfficialPublication.PublicationType.COMMUNIQUE,
        "excerpt": "ECO RDC Intelligence rappelle les mesures prioritaires pour limiter les depots sauvages et proteger les quartiers.",
        "body": "Les communes sont invitees a renforcer les points de collecte, la sensibilisation locale et le suivi des depots recurrents.",
        "scope_label": "National",
        "is_featured": True,
    },
    {
        "title": "Conseils citoyens pour un signalement utile",
        "slug": "conseils-citoyens-pour-un-signalement-utile",
        "publication_type": OfficialPublication.PublicationType.CAMPAGNE,
        "excerpt": "Une photo nette, une position precise et une description concrete accelerent l'intervention des autorites.",
        "body": "Chaque signalement doit decrire le danger, la commune, les reperes proches et l'evolution observee.",
        "scope_label": "RDC",
        "is_featured": False,
    },
]


class Command(BaseCommand):
    """Seed operational reference data required by forms, dashboards and AI."""

    help = "Create or update ECO RDC provinces, communes and signalement categories."

    def handle(self, *args, **options):
        province, _ = Province.objects.update_or_create(
            code="KIN",
            defaults={
                "name": "Kinshasa",
                "centroid_latitude": "-4.3250000",
                "centroid_longitude": "15.3222000",
                "ecological_score": 70,
            },
        )

        for item in KINSHASA_COMMUNES:
            Commune.objects.update_or_create(
                code=item["code"],
                defaults={
                    "province": province,
                    "name": item["name"],
                    "centroid_latitude": item["lat"],
                    "centroid_longitude": item["lng"],
                    "ecological_score": item["score"],
                    "risk_level": item["risk"],
                },
            )

        for item in CATEGORIES:
            Category.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "name": item["name"],
                    "color": item["color"],
                    "icon": item["icon"],
                    "is_active": True,
                },
            )

        for item in PUBLICATIONS:
            OfficialPublication.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    **item,
                    "status": OfficialPublication.Status.PUBLISHED,
                    "is_public": True,
                },
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Reference data ready: {Province.objects.count()} province(s), "
                f"{Commune.objects.count()} commune(s), {Category.objects.count()} categorie(s), "
                f"{OfficialPublication.objects.count()} publication(s)."
            )
        )
