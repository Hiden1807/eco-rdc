"""Validation stricte des sorties IA.

Un modele generatif peut changer de formulation. Le backend, lui, doit rester
stable: chaque validate_* transforme une sortie Gemini/OpenRouter en dictionnaire
controle, compatible avec les modeles Django et les composants React.
"""

from typing import Any

from .exceptions import AIValidationError


GRAVITY_VALUES = {"faible", "moyen", "eleve", "critique"}
GRAVITY_ALIASES = {
    "moyenne": "moyen",
    "modere": "moyen",
    "moderee": "moyen",
    "elevee": "eleve",
    "haute": "eleve",
    "urgent": "critique",
    "urgence": "critique",
}


def _as_dict(data: Any, context: str) -> dict:
    if not isinstance(data, dict):
        raise AIValidationError(f"Sortie IA invalide pour {context}: dictionnaire attendu.")
    return data


def _as_str(value: Any, default: str = "") -> str:
    if value is None:
        return default
    return str(value).strip()


def _as_list(value: Any) -> list:
    if isinstance(value, list):
        return [item for item in value if item not in (None, "")]
    if value in (None, "", {}):
        return []
    return [value]


def _as_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "oui", "yes", "vrai"}
    return default


def _score(value: Any, default: int = 0) -> int:
    try:
        raw = float(value)
    except (TypeError, ValueError):
        raw = float(default or 0)
    if 0 < raw <= 1:
        raw *= 100
    number = int(round(raw))
    return max(0, min(100, number))


def normalize_gravity_value(value: Any, default: str = "moyen") -> str:
    normalized = _as_str(value, default).lower()
    normalized = normalized.replace("é", "e").replace("è", "e").replace("ê", "e")
    normalized = GRAVITY_ALIASES.get(normalized, normalized)
    return normalized if normalized in GRAVITY_VALUES else default


def validate_signalement_analysis(data: Any, fallback: dict | None = None) -> dict:
    """Valide une analyse image/texte de signalement.

    Les cles retournees couvrent a la fois le schema IA avance et les champs
    historiques deja consommes par `apply_ai_analysis`.
    """

    fallback = fallback or {}
    d = _as_dict(data or fallback, "analyse de signalement")
    gravity = normalize_gravity_value(d.get("gravite") or d.get("gravity") or fallback.get("gravite"))
    confidence = _score(d.get("score_confiance") or d.get("confidence_score") or d.get("confiance"), fallback.get("score_confiance", 0))
    summary = _as_str(d.get("resume_court") or d.get("resume") or d.get("summary") or fallback.get("resume"))
    authority_reco = _as_str(
        d.get("recommandation_autorite")
        or d.get("recommandation")
        or d.get("recommendation")
        or fallback.get("recommandation_autorite")
    )
    citizen_reco = _as_str(d.get("recommandation_citoyen") or fallback.get("recommandation_citoyen"))
    risks = _as_list(d.get("risques_detectes") or d.get("risques_probables") or fallback.get("risques_detectes"))

    return {
        "categorie_detectee": _as_str(d.get("categorie_detectee") or d.get("category_detected") or fallback.get("categorie_detectee"), "autre incident environnemental"),
        "sous_categorie": _as_str(d.get("sous_categorie")),
        "gravite": gravity,
        "urgence": _as_str(d.get("urgence") or d.get("urgency") or fallback.get("urgence"), "controle sous 72 heures"),
        "resume": summary,
        "resume_court": summary,
        "description_amelioree": _as_str(d.get("description_amelioree") or fallback.get("description_amelioree")),
        "elements_visuels_detectes": _as_list(d.get("elements_visuels_detectes")),
        "dangers_visibles": _as_list(d.get("dangers_visibles")),
        "risques_detectes": risks,
        "risques_probables": risks,
        "recommandation": authority_reco,
        "recommandation_autorite": authority_reco,
        "recommandation_citoyen": citizen_reco,
        "action_prioritaire": _as_str(d.get("action_prioritaire") or d.get("priorite_traitement")),
        "delai_intervention_recommande": _as_str(d.get("delai_intervention_recommande") or d.get("delai_recommande")),
        "score_confiance": confidence,
        "coherence_image_description": _as_str(d.get("coherence_image_description") or d.get("coherence"), "moyenne"),
        "necessite_verification_humaine": _as_bool(d.get("necessite_verification_humaine"), default=confidence < 60),
        "raisons_verification": _as_list(d.get("raisons_verification")),
        "notification_a_envoyer": _as_bool(d.get("notification_a_envoyer") or d.get("notification_recommandee"), default=gravity in {"eleve", "critique"}),
        "type_intervention": _as_str(d.get("type_intervention") or d.get("intervention_type"), "equipe terrain"),
        "niveau_priorite": _as_str(d.get("niveau_priorite") or d.get("priorite_traitement")),
        "equipe_conseillee": _as_str(d.get("equipe_conseillee") or d.get("suggested_team"), "assainissement et environnement"),
        "actions_preventives": _as_list(d.get("actions_preventives")),
        "conseils_publics": _as_list(d.get("conseils_publics")),
        "_provider": _as_str(d.get("_provider")),
        "_model": _as_str(d.get("_model")),
    }


def validate_report_payload(data: Any) -> dict:
    d = _as_dict(data, "rapport IA")
    return {
        "titre": _as_str(d.get("titre"), "Rapport ECO RDC Intelligence"),
        "periode": d.get("periode") if isinstance(d.get("periode"), dict) else {},
        "resume_executif": _as_str(d.get("resume_executif")),
        "analyse_ia": _as_str(d.get("analyse_ia") or d.get("analyse_statistique")),
        "risques_detectes": _as_list(d.get("risques_detectes") or d.get("risques")),
        "incidents_critiques": _as_list(d.get("incidents_critiques")),
        "zones_prioritaires": _as_list(d.get("zones_prioritaires")),
        "recommandations_operationnelles": _as_list(d.get("recommandations_operationnelles")),
        "recommandations_strategiques": _as_list(d.get("recommandations_strategiques")),
        "priorites_intervention": _as_list(d.get("priorites_intervention") or d.get("plan_action")),
        "limites_donnees": _as_list(d.get("limites_donnees")),
        "conclusion": _as_str(d.get("conclusion")),
        "signature": _as_str(d.get("signature"), "ECO RDC Intelligence - Groupe Les Travailleurs, Math-Info UNIKIN"),
    }
