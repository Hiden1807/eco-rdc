import json
import math
import os
import re
import time
from datetime import datetime
from decimal import Decimal
from difflib import SequenceMatcher

from django.conf import settings
from django.utils import timezone
from django.utils.text import slugify
from PIL import ExifTags, Image

from apps.ai.models import AIAnalysis
from apps.signalements.models import Category, Signalement
from .audit import provider_from_payload, record_ai_operation
from .engine import generate_text
from .exceptions import AIError, AIProviderUnavailable
from .gemini import generate_with_best_provider
from .json_safety import make_json_safe
from .prompts import IMAGE_ANALYSIS_PROMPT
from .schemas import validate_signalement_analysis


CATEGORY_KEYWORDS = {
    "dechets": ["dechet", "ordure", "poubelle", "plastique", "immondice", "decharge"],
    "inondation": ["inondation", "eau", "pluie", "stagnante", "ruissellement"],
    "erosion": ["erosion", "ravin", "glissement", "terre", "route coupee"],
    "pollution_eau": ["riviere", "eau polluee", "canal", "huile", "toxique"],
    "caniveau_bouche": ["caniveau", "egout", "bouche", "drain", "avaloir"],
    "deforestation": ["arbre", "deforestation", "coupe", "foret"],
    "pollution_air": ["fumee", "air", "odeur", "brulure", "emission"],
}

DISPLAY_CATEGORIES = {
    "dechets": "dechets",
    "inondation": "inondation",
    "erosion": "erosion",
    "pollution_eau": "pollution d'eau",
    "caniveau_bouche": "caniveau bouche",
    "deforestation": "deforestation",
    "pollution_air": "pollution de l'air",
}

GRAVITY_ALIASES = {
    "faible": "faible",
    "low": "faible",
    "moyen": "moyen",
    "moyenne": "moyen",
    "modere": "moyen",
    "moderee": "moyen",
    "medium": "moyen",
    "eleve": "eleve",
    "elevee": "eleve",
    "haute": "eleve",
    "high": "eleve",
    "critique": "critique",
    "critical": "critique",
    "urgence": "critique",
}

GRAVITY_KEYWORDS = {
    "critique": ["mort", "danger", "critique", "effondrement", "ecole", "hopital", "bloque"],
    "eleve": ["urgent", "grave", "deborde", "rapide", "forte", "quartier"],
    "moyen": ["important", "visible", "plusieurs", "sale"],
}


def _decimal_to_float(value):
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def haversine_m(lat1, lon1, lat2, lon2):
    if None in {lat1, lon1, lat2, lon2}:
        return None
    r = 6371000
    phi1 = math.radians(float(lat1))
    phi2 = math.radians(float(lat2))
    delta_phi = math.radians(float(lat2) - float(lat1))
    delta_lambda = math.radians(float(lon2) - float(lon1))
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    return int(2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


def _gps_to_decimal(gps_coord, ref):
    degrees, minutes, seconds = gps_coord
    decimal = float(degrees) + float(minutes) / 60 + float(seconds) / 3600
    if ref in ["S", "W"]:
        decimal *= -1
    return decimal


def extract_exif_metadata(image_path):
    metadata = {"latitude": None, "longitude": None, "taken_at": None}
    try:
        image = Image.open(image_path)
        exif = image.getexif()
        if not exif:
            return metadata
        decoded = {ExifTags.TAGS.get(key, key): value for key, value in exif.items()}
        gps_info = decoded.get("GPSInfo")
        if gps_info:
            gps_decoded = {ExifTags.GPSTAGS.get(key, key): value for key, value in gps_info.items()}
            if "GPSLatitude" in gps_decoded and "GPSLongitude" in gps_decoded:
                metadata["latitude"] = _gps_to_decimal(gps_decoded["GPSLatitude"], gps_decoded.get("GPSLatitudeRef", "N"))
                metadata["longitude"] = _gps_to_decimal(gps_decoded["GPSLongitude"], gps_decoded.get("GPSLongitudeRef", "E"))
        taken = decoded.get("DateTimeOriginal") or decoded.get("DateTime")
        if taken:
            metadata["taken_at"] = timezone.make_aware(datetime.strptime(taken, "%Y:%m:%d %H:%M:%S"))
    except Exception:
        return metadata
    return metadata


def _classify_text(text):
    normalized = text.lower()
    scores = {
        key: sum(1 for keyword in keywords if keyword in normalized)
        for key, keywords in CATEGORY_KEYWORDS.items()
    }
    best = max(scores, key=scores.get)
    return DISPLAY_CATEGORIES[best] if scores[best] > 0 else "autre incident environnemental"


def _estimate_gravity(text):
    normalized = text.lower()
    for gravity, keywords in GRAVITY_KEYWORDS.items():
        if any(keyword in normalized for keyword in keywords):
            return gravity
    return "moyen"


def normalize_gravity(value):
    if not value:
        return "moyen"
    normalized = (
        str(value)
        .lower()
        .strip()
        .replace("é", "e")
        .replace("è", "e")
        .replace("ê", "e")
        .replace("à", "a")
    )
    return GRAVITY_ALIASES.get(normalized, "moyen")


def normalize_confidence(value):
    try:
        number = float(value or 0)
    except (TypeError, ValueError):
        return 0
    if 0 < number <= 1:
        number *= 100
    return max(0, min(100, int(round(number))))


def _heuristic_analysis(signalement):
    combined = f"{signalement.title} {signalement.description}"
    category = _classify_text(combined)
    gravity = _estimate_gravity(combined)
    confidence = 88 if category != "autre incident environnemental" else 61
    urgency = {
        "critique": "intervention immediate",
        "eleve": "intervention rapide",
        "moyen": "controle sous 72 heures",
        "faible": "suivi planifie",
    }.get(gravity, "controle sous 72 heures")
    recommendation = {
        "dechets": "Affecter une equipe d'assainissement et verifier les points de collecte proches.",
        "caniveau bouche": "Deboucher le caniveau et inspecter le reseau de drainage voisin.",
        "inondation": "Baliser la zone, pomper l'eau et controler les drains avant la prochaine pluie.",
        "erosion": "Envoyer une equipe technique pour securiser le terrain et planifier une stabilisation.",
        "pollution d'eau": "Prelever un echantillon et isoler temporairement la source de pollution.",
    }.get(category, "Faire verifier le signalement par l'autorite locale et definir une intervention adaptee.")
    summary = f"Signalement detecte comme {category} avec un niveau de gravite {gravity}."
    citizen_recommendation = "Eviter la zone signalee, ne pas manipuler les dechets ou eaux suspectes et suivre les notifications officielles."
    risks = [
        "aggravation locale si aucune intervention n'est engagee",
        "risque de recurrence dans la commune si le facteur source n'est pas traite",
    ]
    return {
        "categorie_detectee": category,
        "gravite": gravity,
        "urgence": urgency,
        "resume": summary,
        "resume_court": summary,
        "description_amelioree": signalement.description.strip(),
        "risques_detectes": risks,
        "recommandation": recommendation,
        "recommandation_autorite": recommendation,
        "recommandation_citoyen": citizen_recommendation,
        "delai_intervention_recommande": "24 heures" if gravity in {"critique", "eleve"} else "72 heures",
        "coherence_image_description": "forte" if len(signalement.description) > 24 else "moyenne",
        "priorite_traitement": urgency,
        "notification_a_envoyer": gravity in {"critique", "eleve"},
        "risques_predictifs": risks,
        "actions_preventives": [recommendation],
        "conseils_publics": [
            citizen_recommendation,
            "Documenter toute evolution avec une photo claire et une position precise.",
        ],
        "publication_recommandee": {
            "type": "conseil",
            "titre": f"Conseils preventifs - {category}",
            "resume": recommendation,
        },
        "score_confiance": confidence,
        "coherence": "forte" if len(signalement.description) > 24 else "moyenne",
        "type_intervention": "equipe terrain",
        "niveau_priorite": urgency,
        "delai_recommande": "24 heures" if gravity in {"critique", "eleve"} else "72 heures",
        "equipe_conseillee": "assainissement et environnement",
    }


def _parse_json_response(text):
    match = re.search(r"\{.*\}", text, flags=re.S)
    if not match:
        return {}
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return {}


def _gemini_analysis(signalement):
    context = {
        "titre": signalement.title,
        "description": signalement.description,
        "commune": signalement.commune.name if signalement.commune_id else "",
        "province": signalement.province.name if signalement.province_id else "",
        "categorie_choisie": signalement.category.name if signalement.category_id else "",
        "latitude": str(signalement.latitude or ""),
        "longitude": str(signalement.longitude or ""),
        "adresse": signalement.address_text,
        "historique_proche": list(
            Signalement.objects.exclude(pk=signalement.pk)
            .filter(commune_id=signalement.commune_id)
            .values("id", "title", "gravity", "status", "created_at")[:8]
        )
        if signalement.commune_id
        else [],
    }
    return generate_with_best_provider(
        IMAGE_ANALYSIS_PROMPT,
        image_path=signalement.photo.path if signalement.photo else None,
        text_context=json.dumps(context, default=str, ensure_ascii=False),
    )


def _analysis_unavailable(signalement, error_code="provider_unavailable"):
    if not getattr(settings, "AI_ALLOW_LOCAL_FALLBACK", False):
        gravity = normalize_gravity(signalement.gravity)
        category = signalement.category.name if signalement.category_id else "verification humaine requise"
        summary = "Analyse IA temporairement indisponible. Verification humaine requise avant toute priorisation automatique."
        return {
            "categorie_detectee": category,
            "gravite": gravity,
            "urgence": "verification humaine requise",
            "resume": summary,
            "resume_court": summary,
            "description_amelioree": signalement.description.strip(),
            "risques_detectes": [],
            "risques_probables": [],
            "recommandation": "Verifier manuellement le signalement, la photo et la localisation avant decision.",
            "recommandation_autorite": "Verifier manuellement le signalement, la photo et la localisation avant decision.",
            "recommandation_citoyen": "Votre signalement a ete enregistre. Une verification humaine est necessaire car ECO IA est indisponible.",
            "delai_intervention_recommande": "",
            "coherence_image_description": "non_evaluee",
            "priorite_traitement": "verification_humaine",
            "notification_a_envoyer": False,
            "score_confiance": 0,
            "necessite_verification_humaine": True,
            "raisons_verification": [error_code],
            "_provider": "",
            "_model": "",
            "_source": "error",
            "_error_code": error_code,
        }
    text = f"{signalement.title} {signalement.description}".lower()
    gravity = _estimate_gravity(text) or normalize_gravity(signalement.gravity)
    category = signalement.category.name if signalement.category_id else _classify_text(text)
    summary = f"Pre-analyse locale ECO IA: {category}, gravite {gravity}. La photo et la position doivent rester visibles pour validation humaine."
    return {
        "categorie_detectee": category,
        "gravite": gravity,
        "urgence": "intervention immediate" if gravity == "critique" else "controle sous 72 heures",
        "resume": summary,
        "resume_court": summary,
        "description_amelioree": signalement.description.strip(),
        "risques_detectes": ["aggravation possible si la situation reste non traitee"],
        "risques_probables": ["recurrence locale probable si la source du probleme n'est pas supprimee"],
        "recommandation": "Verifier la preuve photo, confirmer la position GPS et programmer une verification terrain.",
        "recommandation_autorite": "Verifier la preuve photo, confirmer la position GPS et programmer une verification terrain.",
        "recommandation_citoyen": "Restez a distance de la zone, completez les informations utiles et suivez les notifications officielles.",
        "delai_intervention_recommande": "24 heures" if gravity in {"critique", "eleve"} else "72 heures",
        "coherence_image_description": "a_verifier",
        "priorite_traitement": "haute" if gravity in {"critique", "eleve"} else "normale",
        "notification_a_envoyer": gravity in {"critique", "eleve"},
        "score_confiance": 62,
        "necessite_verification_humaine": True,
        "raisons_verification": [error_code],
        "_provider": "",
        "_model": "",
        "_source": "local_fallback",
        "_error_code": error_code,
    }


def find_probable_duplicate(signalement, radius_m=250):
    lat = _decimal_to_float(signalement.latitude)
    lon = _decimal_to_float(signalement.longitude)
    if lat is None or lon is None:
        return None, 0
    recent = Signalement.objects.exclude(pk=signalement.pk).filter(
        created_at__gte=timezone.now() - timezone.timedelta(days=14)
    )
    if signalement.commune_id:
        recent = recent.filter(commune_id=signalement.commune_id)
    best, score = None, 0
    for item in recent[:300]:
        distance = haversine_m(lat, lon, item.latitude, item.longitude)
        if distance is None or distance > radius_m:
            continue
        text_score = SequenceMatcher(None, signalement.description.lower(), item.description.lower()).ratio()
        category_match = 1 if item.category_id and item.category_id == signalement.category_id else 0
        candidate_score = int((1 - distance / radius_m) * 45 + text_score * 40 + category_match * 15)
        if candidate_score > score:
            best, score = item, candidate_score
    return best, score


def analyze_signalement(signalement):
    started = time.monotonic()
    provider = ""
    model = ""
    success = False
    error_code = ""

    try:
        generated = _gemini_analysis(signalement) or {}
        provider, model = provider_from_payload(generated)
        if generated:
            base = validate_signalement_analysis(generated, fallback={})
            success = True
        else:
            raise AIProviderUnavailable("Provider image indisponible.")
    except AIError as exc:
        error_code = exc.code
        base = _analysis_unavailable(signalement, error_code=error_code)
    except Exception:
        error_code = "invalid_ai_response"
        base = _analysis_unavailable(signalement, error_code=error_code)

    exif = extract_exif_metadata(signalement.photo.path) if signalement.photo else {}
    duplicate, duplicate_score = find_probable_duplicate(signalement)
    flags = []
    if len(signalement.description.strip()) < 18:
        flags.append("description_trop_vague")
    if exif.get("latitude") and signalement.latitude:
        distance = haversine_m(exif["latitude"], exif["longitude"], signalement.latitude, signalement.longitude)
        if distance and distance > 700:
            flags.append("position_incoherente")
    else:
        distance = None
    if duplicate_score >= 60:
        flags.append("doublon_probable")

    base.update(
        {
            "exif": exif,
            "position_discrepancy_m": distance,
            "duplicate": duplicate,
            "duplicate_probability": duplicate_score,
            "fraud_flags": flags,
        }
    )
    record_ai_operation(
        user=signalement.created_by,
        operation="image_analysis",
        started=started,
        success=success,
        provider=provider,
        model_name=model,
        target_type="signalement",
        target_id=signalement.id,
        error_code=error_code,
        fallback_used=base.get("_source") == "local_fallback",
        metadata={
            "gravity": base.get("gravite"),
            "confidence": base.get("score_confiance"),
            "duplicate_probability": duplicate_score,
            "fraud_flags": flags,
        },
    )
    return base


def apply_ai_analysis(signalement, analysis):
    category_label = analysis.get("categorie_detectee", "autre incident environnemental")
    category_slug = slugify(category_label)
    category = Category.objects.filter(slug=category_slug).first()
    if not category:
        category = Category.objects.filter(name__icontains=category_label[:20]).first()

    exif = analysis.get("exif") or {}
    gravity = normalize_gravity(analysis.get("gravite", signalement.gravity))
    signalement.category = category or signalement.category
    signalement.detected_category_label = category_label
    signalement.gravity = gravity
    signalement.urgency_level = analysis.get("urgence", "")
    signalement.ai_summary = analysis.get("resume_court") or analysis.get("resume", "")
    signalement.ai_recommendation = analysis.get("recommandation_autorite") or analysis.get("recommandation", "")
    signalement.ai_score = normalize_confidence(analysis.get("score_confiance", 0))
    signalement.exif_latitude = exif.get("latitude")
    signalement.exif_longitude = exif.get("longitude")
    signalement.exif_taken_at = exif.get("taken_at")
    signalement.position_discrepancy_m = analysis.get("position_discrepancy_m")
    signalement.duplicate_of = analysis.get("duplicate")
    signalement.is_probable_duplicate = bool(analysis.get("duplicate_probability", 0) >= 60)
    signalement.fraud_flags = analysis.get("fraud_flags", [])
    signalement.eco_score_impact = {"faible": 4, "moyen": 9, "eleve": 17, "critique": 28}.get(signalement.gravity, 9)
    signalement.save()

    AIAnalysis.objects.update_or_create(
        signalement=signalement,
        defaults={
            "category_detected": category_label,
            "gravity": signalement.gravity,
            "urgency": signalement.urgency_level,
            "summary": signalement.ai_summary,
            "recommendation": signalement.ai_recommendation,
            "confidence_score": signalement.ai_score,
            "coherence": analysis.get("coherence_image_description") or analysis.get("coherence", "moyenne"),
            "intervention_type": analysis.get("type_intervention", ""),
            "priority_level": analysis.get("priorite_traitement") or analysis.get("niveau_priorite", ""),
            "recommended_delay": analysis.get("delai_intervention_recommande") or analysis.get("delai_recommande", ""),
            "suggested_team": analysis.get("equipe_conseillee", ""),
            "duplicate_probability": analysis.get("duplicate_probability", 0),
            "fraud_flags": signalement.fraud_flags,
            "raw_response": make_json_safe({k: v for k, v in analysis.items() if k not in {"duplicate"}}),
        },
    )
    return signalement


def answer_ministry_question(question, context):
    ai_answer = answer_platform_question(question, context)
    if ai_answer:
        return ai_answer
    return "ECO IA est temporairement indisponible."


def answer_platform_question(question, context):
    prompt = """
Tu es l'assistant IA officiel de ECO RDC Intelligence.
Tu reponds comme un analyste environnemental pour une autorite publique.
Tu dois utiliser uniquement le contexte fourni: signalements, communes, gravites, statuts, rapports et risques.
Si une information manque, dis-le clairement et propose l'action a mener.
Reponse en francais, structuree, concise, avec recommandations operationnelles.
"""
    text_context = json.dumps({"question": question, "context": context}, default=str, ensure_ascii=False)
    return generate_text(prompt, text_context).strip()
