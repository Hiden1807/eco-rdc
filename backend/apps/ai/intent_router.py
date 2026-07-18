import unicodedata


INTENT_LABELS = {
    "greeting",
    "identity",
    "capabilities",
    "general_help",
    "navigation_help",
    "signalement_help",
    "statistics_query",
    "risk_query",
    "prediction_query",
    "report_query",
    "education_query",
    "recommendation_query",
    "geographic_query",
    "comparison_query",
    "alert_query",
    "status_query",
    "unknown",
}

DATA_REQUIRED_INTENTS = {
    "alert_query",
    "statistics_query",
    "signalement_help",
    "status_query",
    "risk_query",
    "prediction_query",
    "report_query",
    "comparison_query",
    "geographic_query",
    "recommendation_query",
}


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", (value or "").lower().replace("’", "'"))
    normalized = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return " ".join(normalized.replace("-", " ").replace("?", " ").replace("!", " ").split())


def classify_intent(question: str) -> str:
    q = normalize_text(question)
    if not q:
        return "unknown"
    if len(q) <= 35 and q in {"bonjour", "bonsoir", "salut", "hello", "bjr", "slt"}:
        return "greeting"
    if any(token in q for token in ("qui t'a cree", "qui ta cree", "qui t a cree", "qui es tu", "ton createur", "ton developpeur", "d ou viens tu")):
        return "identity"
    if any(token in q for token in ("que peux tu faire", "comment peux tu m aider", "tes capacites", "a quoi tu sers")):
        return "capabilities"
    if any(token in q for token in ("combien", "statistique", "stats", "nombre", "total", "taux", "evolution")):
        return "statistics_query"
    if any(token in q for token in ("risque", "danger", "critique", "prioritaire", "priorite")):
        return "risk_query"
    if any(token in q for token in ("prediction", "prevoir", "prevision", "tendance")):
        return "prediction_query"
    if any(token in q for token in ("rapport", "resume executif", "synthese")):
        return "report_query"
    if any(token in q for token in ("carte", "zone", "commune", "province", "localisation", "geographique")):
        return "geographic_query"
    if any(token in q for token in ("compare", "comparaison", "versus", "entre")):
        return "comparison_query"
    if any(token in q for token in ("alerte", "notification", "prevenir")):
        return "alert_query"
    if any(token in q for token in ("statut", "etat", "suivi")):
        return "status_query"
    if any(token in q for token in ("signalement", "signaler", "photo", "incident")):
        return "signalement_help"
    if any(token in q for token in ("education", "sensibilisation", "conseil", "prevenir")):
        return "education_query"
    if any(token in q for token in ("recommande", "que dois je faire", "quoi faire", "action")):
        return "recommendation_query"
    if any(token in q for token in ("page", "menu", "ou trouver", "naviguer")):
        return "navigation_help"
    return "general_help"


def needs_data_context(intent: str) -> bool:
    return intent in DATA_REQUIRED_INTENTS
