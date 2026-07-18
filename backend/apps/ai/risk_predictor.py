"""Moteur predictif ECO IA.

Le score reste deterministe et explicable: il s'appuie uniquement sur les
signalements reels, leur gravite, leur frequence, leur statut, leur commune et
le taux de resolution. Le fournisseur IA peut ensuite commenter ces donnees,
mais la plateforme conserve une prediction fiable meme sans reseau externe.
"""

from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone

from apps.locations.models import Commune
from apps.signalements.models import Signalement


def _risk_level(score):
    if score >= 78:
        return "critique"
    if score >= 58:
        return "eleve"
    if score >= 35:
        return "moyen"
    return "faible"


def _trend(recent, previous):
    if recent > previous:
        return "en_hausse"
    if recent < previous:
        return "en_baisse"
    return "stable"


def _probable_risks(rows):
    labels = {row["detected_category_label"] or "" for row in rows}
    text = " ".join(labels).lower()
    risks = []
    if any(word in text for word in ["inond", "caniveau", "drain"]):
        risks.append("risque d'inondation")
    if any(word in text for word in ["dechet", "insalub", "ordure"]):
        risks.append("risque sanitaire")
        risks.append("risque de propagation des dechets")
    if any(word in text for word in ["eau", "pollution"]):
        risks.append("risque de pollution")
    if "erosion" in text:
        risks.append("risque d'erosion aggravee")
    return risks or ["surveillance environnementale recommandee"]


def _confidence(total, recent, critical):
    if total >= 12 or recent >= 5 or critical >= 2:
        return 86
    if total >= 5 or recent >= 2 or critical:
        return 72
    if total >= 1:
        return 58
    return 35


def _deadline(level):
    return {
        "critique": "24 heures",
        "eleve": "48 heures",
        "moyen": "72 heures",
        "faible": "surveillance hebdomadaire",
    }.get(level, "72 heures")


def _recommended_actions(level, risks):
    base = ["Verifier les signalements avec photo et position GPS.", "Mettre a jour les statuts apres chaque action terrain."]
    if level in {"critique", "eleve"}:
        base.insert(0, "Declencher une verification terrain prioritaire.")
    if any("inondation" in risk for risk in risks):
        base.append("Inspecter les caniveaux, drains et points d'eau stagnante.")
    if any("sanitaire" in risk or "dechet" in risk for risk in risks):
        base.append("Programmer une collecte ciblee et une sensibilisation de proximite.")
    if any("erosion" in risk for risk in risks):
        base.append("Securiser la zone et demander une evaluation technique.")
    return base


def predict_risk(days=7, commune_id=None):
    now = timezone.now()
    recent_since = now - timedelta(days=days)
    previous_since = recent_since - timedelta(days=days)
    communes = Commune.objects.select_related("province").all()
    if commune_id:
        communes = communes.filter(id=commune_id)

    predictions = []
    for commune in communes:
        queryset = Signalement.objects.filter(commune=commune)
        total = queryset.count()
        active = queryset.filter(status__in=["en_attente", "valide", "en_cours"]).count()
        resolved = queryset.filter(status="resolu").count()
        critical = queryset.filter(gravity="critique").count()
        high = queryset.filter(gravity="eleve").count()
        recent = queryset.filter(created_at__gte=recent_since).count()
        previous = queryset.filter(created_at__gte=previous_since, created_at__lt=recent_since).count()
        duplicates = queryset.filter(is_probable_duplicate=True).count()
        resolution_rate = (resolved / total) * 100 if total else 0
        ecological_pressure = 100 - int(commune.ecological_score or 70)
        score = min(
            100,
            max(
                0,
                int(
                    ecological_pressure
                    + total * 3
                    + active * 6
                    + critical * 18
                    + high * 10
                    + recent * 9
                    + duplicates * 5
                    - resolution_rate * 0.18
                ),
            ),
        )
        category_rows = list(
            queryset.values("detected_category_label")
            .annotate(total=Count("id"))
            .order_by("-total")[:5]
        )
        level = _risk_level(score)
        risks = _probable_risks(category_rows)
        predictions.append(
            {
                "commune_id": commune.id,
                "commune": commune.name,
                "province": commune.province.name if commune.province_id else "",
                "score_risque": score,
                "niveau_risque": level,
                "tendance": _trend(recent, previous),
                "risques_probables": risks,
                "confiance_prediction": _confidence(total, recent, critical),
                "delai_recommande": _deadline(level),
                "actions_recommandees": _recommended_actions(level, risks),
                "facteurs_decisifs": [
                    f"{active} dossier(s) actif(s)",
                    f"{critical} critique(s)",
                    f"{recent} recent(s) sur {days} jour(s)",
                    f"taux de resolution {round(resolution_rate, 2)}%",
                ],
                "indicateurs": {
                    "total": total,
                    "actifs": active,
                    "resolus": resolved,
                    "critiques": critical,
                    "eleves": high,
                    "recents": recent,
                    "precedents": previous,
                    "doublons": duplicates,
                    "taux_resolution": round(resolution_rate, 2),
                    "score_ecologique": commune.ecological_score,
                },
            }
        )

    predictions.sort(key=lambda item: item["score_risque"], reverse=True)
    top = predictions[:8]
    return {
        "score_risque": top[0]["score_risque"] if top else 0,
        "niveau_risque": top[0]["niveau_risque"] if top else "faible",
        "tendance": top[0]["tendance"] if top else "stable",
        "risques_probables": top[0]["risques_probables"] if top else [],
        "communes_prioritaires": top,
        "recommandation": _recommendation(top),
        "methodologie": "Score explicable base sur gravite, volume, activite recente, doublons, taux de resolution et score ecologique communal.",
    }


def _recommendation(priorities):
    if not priorities:
        return "Je n'ai pas encore assez de donnees dans la plateforme pour repondre precisement."
    first = priorities[0]
    if first["niveau_risque"] in {"critique", "eleve"}:
        return f"Prioriser {first['commune']} avec une verification terrain et une communication publique ciblee."
    return "Maintenir la surveillance, accelerer la resolution des cas actifs et enrichir les signalements avec photos et positions."
