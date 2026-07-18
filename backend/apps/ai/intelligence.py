"""Couche d'intelligence metier utilisee par tous les flux IA.

Le fournisseur IA sait seulement appeler un modele externe. Ce module porte la
logique ECO RDC: roles, signalements, communes, regles de publication, analyse
predictive et decisions operationnelles.
"""

import json
import os
import tempfile
import time
import unicodedata

from django.conf import settings
from django.db import DatabaseError
from django.db.models import Count

from apps.locations.models import Commune
from apps.signalements.models import Signalement

from .audit import provider_from_payload, record_ai_operation
from .context_builder import build_relevant_context, get_user_role
from .engine import generate_json, generate_text, generate_text_result, provider_status
from .exceptions import AIError, AIProviderUnavailable
from .gemini import generate_with_best_provider
from .intent_router import classify_intent, needs_data_context
from .models import AIConversation, AIMessage
from .prompts import (
    GLOBAL_SYSTEM_PROMPT,
    IMAGE_ANALYSIS_PROMPT,
    OFFICIAL_CREATOR_RESPONSE,
    ROLE_BEHAVIOR_PROMPTS,
    SIGNAL_ANALYSIS_SCHEMA,
)
from .schemas import validate_signalement_analysis


ROLE_SYSTEM_PROMPTS = {
    role: f"{GLOBAL_SYSTEM_PROMPT}\n\n{prompt}"
    for role, prompt in ROLE_BEHAVIOR_PROMPTS.items()
}


def local_fallback_enabled():
    return bool(getattr(settings, "AI_ALLOW_LOCAL_FALLBACK", False))

IDENTITY_PATTERNS = [
    "qui ta cree",
    "qui t a cree",
    "qui tas cree",
    "qui t'a cree",
    "qui vous a cree",
    "qui ta developpe",
    "qui t a developpe",
    "qui t'a developpe",
    "qui vous a developpe",
    "d ou viens tu",
    "d'ou viens tu",
    "qui est derriere toi",
    "qui est ton createur",
    "qui est ton developpeur",
    "ton createur",
    "ton developpeur",
]

GREETING_PATTERNS = [
    "bonjour",
    "bonsoir",
    "salut",
    "hello",
    "bjr",
    "slt",
]


def is_real_user(user):
    return bool(getattr(user, "is_authenticated", False) and getattr(user, "id", 0))


def normalize_question(value):
    normalized = unicodedata.normalize("NFD", value.lower().replace("’", "'"))
    normalized = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return " ".join(normalized.replace("-", " ").replace("?", " ").split())


def is_identity_question(question):
    normalized = normalize_question(question)
    return any(pattern in normalized for pattern in IDENTITY_PATTERNS)


def is_greeting(question):
    normalized = normalize_question(question)
    return len(normalized) <= 35 and any(pattern == normalized or normalized.startswith(f"{pattern} ") for pattern in GREETING_PATTERNS)


def get_or_create_conversation(user, conversation_id=None, page_context=""):
    """Recupere une conversation IA sans jamais faire confiance a un id tiers."""

    if not is_real_user(user):
        return None
    if conversation_id:
        try:
            return AIConversation.objects.get(id=conversation_id, user=user, is_archived=False)
        except (AIConversation.DoesNotExist, ValueError, TypeError):
            pass
    return AIConversation.objects.create(
        user=user,
        role_at_creation=getattr(user, "role", "citoyen"),
        page_context=(page_context or "")[:120],
    )


def recent_conversation_history(conversation, limit=10):
    if not conversation:
        return []
    rows = conversation.messages.order_by("-created_at").values("role", "content", "intent")[:limit]
    return list(reversed(list(rows)))


def persist_conversation_exchange(conversation, role, question, answer, intent, metadata=None):
    if not conversation:
        return
    AIMessage.objects.create(
        conversation=conversation,
        role="user",
        role_of_user_at_message=role,
        content=question,
        intent=intent,
    )
    AIMessage.objects.create(
        conversation=conversation,
        role="assistant",
        role_of_user_at_message=role,
        content=answer,
        intent=intent,
        metadata=metadata or {},
    )
    conversation.save(update_fields=["updated_at"])


def compact_platform_context(context):
    """Reduit le contexte envoye au LLM pour accelerer Gemini et limiter le bruit."""

    return {
        "role": context.get("role"),
        "user": context.get("user"),
        "counts": context.get("counts"),
        "top_communes": (context.get("top_communes") or [])[:4],
        "top_categories": (context.get("top_categories") or [])[:4],
        "recent_signalements": (context.get("recent_signalements") or [])[:5],
        "risk_zones": (context.get("risk_zones") or [])[:4],
        "recent_reports": (context.get("recent_reports") or [])[:3],
    }


def build_platform_context(user):
    """Build a scoped data context according to the authenticated role."""
    queryset = Signalement.objects.select_related("commune", "province", "category", "created_by")
    is_demo = getattr(user, "is_demo_ai", False)
    if user.role == "citoyen" and not is_demo:
        queryset = queryset.filter(created_by=user)
    elif user.role == "autorite" and user.commune_id:
        queryset = queryset.filter(commune_id=user.commune_id)
    elif user.role == "autorite" and is_demo:
        queryset = queryset.filter(commune__name__in=["Barumbu", "Limete", "Masina"])

    top_communes = list(
        queryset.values("commune__name")
        .exclude(commune__name__isnull=True)
        .annotate(total=Count("id"))
        .order_by("-total")[:5]
    )
    top_categories = list(
        queryset.values("detected_category_label")
        .annotate(total=Count("id"))
        .order_by("-total")[:6]
    )
    recent_signalements = list(
        queryset.values("id", "title", "status", "gravity", "commune__name", "created_at", "ai_summary", "ai_recommendation")
        .order_by("-created_at")[:12]
    )
    risk_zones = Commune.objects.order_by("ecological_score")
    if user.role in {"citoyen", "autorite"} and user.commune_id:
        risk_zones = risk_zones.filter(id=user.commune_id)
    try:
        from apps.reports.models import Report

        reports = list(
            Report.objects.values("id", "title", "report_type", "summary", "generated_at")
            .order_by("-generated_at")[:6]
        )
    except Exception:
        reports = []

    total = queryset.count()
    resolved = queryset.filter(status="resolu").count()

    context = {
        "role": user.role,
        "user": {
            "id": user.id,
            "commune": getattr(user.commune, "name", None),
            "province": getattr(user.province, "name", None),
            "organization": user.organization,
        },
        "counts": {
            "total": total,
            "critical": queryset.filter(gravity="critique").count(),
            "active": queryset.filter(status__in=["en_attente", "valide", "en_cours"]).count(),
            "resolved": resolved,
            "duplicates": queryset.filter(is_probable_duplicate=True).count(),
            "resolution_rate": round((resolved / total) * 100, 2) if total else 0,
        },
        "top_communes": top_communes,
        "top_categories": top_categories,
        "recent_signalements": recent_signalements,
        "risk_zones": list(risk_zones.values("name", "risk_level", "ecological_score")[:6]),
        "recent_reports": reports,
        "provider": provider_status(),
    }
    return context


def answer_copilot_question(question, user, conversation_id=None, page_context=""):
    """Repond a une question avec role, donnees reelles et memoire courte."""

    started = time.monotonic()
    role = get_user_role(user)
    conversation = get_or_create_conversation(user, conversation_id=conversation_id, page_context=page_context)
    intent = classify_intent(question)
    database_used = needs_data_context(intent)
    try:
        context = (
            build_relevant_context(user, intent=intent, question=question, page_context=page_context)
            if database_used
            else {
                "role": role,
                "page_context": page_context,
                "question": question,
            }
        )
    except DatabaseError:
        latency_ms = int((time.monotonic() - started) * 1000)
        meta = {
            "provider": "",
            "model": "",
            "source": "error",
            "intent": intent,
            "context_used": False,
            "database_used": False,
            "fallback_used": False,
            "latency_ms": latency_ms,
            "error_code": "database_unavailable",
        }
        final_answer = "ECO IA est temporairement indisponible."
        persist_conversation_exchange(conversation, role, question, final_answer, intent, meta)
        record_ai_operation(
            user=user,
            operation="assistant",
            started=started,
            success=False,
            provider="",
            model_name="",
            error_code="database_unavailable",
            fallback_used=False,
            metadata=meta,
        )
        return {
            "success": False,
            "answer": final_answer,
            "error_code": "database_unavailable",
            "meta": meta,
            "provider": provider_status(live=False),
            "source": "error",
            "conversation_id": str(conversation.id) if conversation else None,
            "intent": intent,
        }
    history = recent_conversation_history(conversation)
    provider_snapshot = provider_status(live=False)
    system_prompt = (
        ROLE_SYSTEM_PROMPTS.get(role, ROLE_SYSTEM_PROMPTS["citoyen"])
        + "\nTu dois produire la reponse finale via le moteur IA configure. "
        + "Les regles d'intention servent uniquement au routage et ne doivent pas remplacer ta reponse. "
        + "N'invente jamais de chiffres, de localisation ou de prediction. "
        + "Si aucun contexte de donnees n'est fourni, reponds naturellement sans statistiques. "
        + "Si un contexte de donnees est fourni, distingue faits calcules, observations, estimations et recommandations. "
        + "Tiens compte de l'historique recent de la conversation si fourni."
    )
    user_prompt = json.dumps(
        {
            "question": question,
            "intent": intent,
            "role_backend": role,
            "historique_recent": history,
            "page_context": page_context,
            "context_used": database_used,
            "database_used": database_used,
            "context": context,
            "configuration_technique": {
                "provider": provider_snapshot.get("provider") or provider_snapshot.get("active"),
                "model": provider_snapshot.get("model"),
            },
        },
        default=str,
        ensure_ascii=False,
    )
    result = generate_text_result(system_prompt, user_prompt, temperature=0.4)
    answer = result.get("text", "")
    latency_ms = int((time.monotonic() - started) * 1000)

    if not answer:
        error_code = result.get("error_code") or "provider_unavailable"
        final_answer = "ECO IA est temporairement indisponible."
        meta = {
            "provider": result.get("provider", ""),
            "model": result.get("model", ""),
            "source": "error",
            "intent": intent,
            "context_used": database_used,
            "database_used": database_used,
            "fallback_used": False,
            "latency_ms": latency_ms,
            "error_code": error_code,
        }
        persist_conversation_exchange(conversation, role, question, final_answer, intent, meta)
        record_ai_operation(
            user=user,
            operation="assistant",
            started=started,
            success=False,
            provider=result.get("provider", ""),
            model_name=result.get("model", ""),
            error_code=error_code,
            fallback_used=False,
            metadata=meta,
        )
        return {
            "success": False,
            "answer": final_answer,
            "error_code": error_code,
            "meta": meta,
            "provider": provider_snapshot,
            "source": "error",
            "conversation_id": str(conversation.id) if conversation else None,
            "intent": intent,
        }

    final_answer = answer
    meta = {
        "provider": result.get("provider", ""),
        "model": result.get("model", ""),
        "source": "provider",
        "intent": intent,
        "context_used": database_used,
        "database_used": database_used,
        "fallback_used": False,
        "latency_ms": latency_ms,
    }
    persist_conversation_exchange(
        conversation,
        role,
        question,
        final_answer,
        intent,
        meta,
    )
    record_ai_operation(
        user=user,
        operation="assistant",
        started=started,
        success=True,
        provider=result.get("provider", ""),
        model_name=result.get("model", ""),
        fallback_used=False,
        metadata=meta,
    )
    return {
        "success": True,
        "answer": final_answer,
        "context": context if database_used else {"role": role, "page_context": page_context},
        "provider": provider_snapshot,
        "source": "provider",
        "conversation_id": str(conversation.id) if conversation else None,
        "intent": intent,
        "meta": meta,
    }


def generate_action_plan(user, objective="prioriser les interventions"):
    """Generate an operational plan that can feed dashboards and reports."""
    context = build_platform_context(user)
    fallback = fallback_action_plan(context)
    payload = generate_json(
        ROLE_SYSTEM_PROMPTS.get(user.role, ROLE_SYSTEM_PROMPTS["ministere"]),
        json.dumps(
            {
                "mission": "Generer un plan d'action environnemental executable pour ECO RDC Intelligence.",
                "objective": objective,
                "context": context,
                "schema": {
                    "executive_summary": "string",
                    "priority_score": "number 0-100",
                    "actions": [
                        {
                            "title": "string",
                            "owner": "string",
                            "deadline": "string",
                            "impact": "string",
                            "risk": "string",
                        }
                    ],
                    "notifications": ["string"],
                    "publication_recommendation": "string",
                },
            },
            default=str,
            ensure_ascii=False,
        ),
        fallback=fallback,
    )
    provider, model = provider_from_payload(payload)
    if not provider and not local_fallback_enabled():
        raise AIProviderUnavailable(
            "Generation de plan d'action IA indisponible.",
            error_code=payload.get("_error_code", "provider_unavailable"),
        )
    fallback_used = not bool(provider)
    return {
        "success": True,
        "plan": payload,
        "context": context,
        "provider": context["provider"],
        "meta": {
            "provider": provider,
            "model": model,
            "source": payload.get("_source", "provider"),
            "fallback_used": fallback_used,
            "error_code": payload.get("_error_code", "") if fallback_used else "",
        },
    }


def triage_signalement_payload(user, payload):
    """Pre-analyse un signalement avant enregistrement ou dispatch terrain."""
    started = time.monotonic()
    try:
        context = build_platform_context(user)
    except DatabaseError:
        record_ai_operation(
            user=user,
            operation="signalement_triage",
            started=started,
            success=False,
            error_code="database_unavailable",
            fallback_used=False,
            metadata={"has_image": False},
        )
        return {
            "success": False,
            "error_code": "database_unavailable",
            "analysis": None,
            "provider": provider_status(live=False),
            "meta": {"source": "error", "fallback_used": False},
        }
    fallback = fallback_triage(payload)
    ai_payload = generate_json(
        ROLE_SYSTEM_PROMPTS["autorite"],
        json.dumps(
            {
                "mission": "Pre-analyser un signalement citoyen avant enregistrement.",
                "signalement": payload,
                "context": context,
                "schema": SIGNAL_ANALYSIS_SCHEMA,
            },
            default=str,
            ensure_ascii=False,
        ),
        fallback=fallback,
    )
    provider, model = provider_from_payload(ai_payload)
    if not provider and not local_fallback_enabled():
        error_code = ai_payload.get("_error_code", "provider_unavailable")
        record_ai_operation(
            user=user,
            operation="signalement_triage",
            started=started,
            success=False,
            provider="",
            model_name="",
            error_code=error_code,
            fallback_used=False,
            metadata={"has_image": False},
        )
        return {
            "success": False,
            "error_code": error_code,
            "analysis": None,
            "provider": context["provider"],
            "meta": {"source": "error", "fallback_used": False},
        }
    analysis = validate_signalement_analysis(ai_payload, fallback=fallback)
    fallback_used = not bool(provider)
    record_ai_operation(
        user=user,
        operation="signalement_triage",
        started=started,
        success=bool(provider),
        provider=provider,
        model_name=model,
        error_code="" if provider else "provider_unavailable",
        fallback_used=fallback_used,
        metadata={"has_image": False, "gravity": analysis.get("gravite")},
    )
    return {
        "success": True,
        "analysis": analysis,
        "provider": context["provider"],
        "meta": {
            "source": ai_payload.get("_source", "provider"),
            "fallback_used": fallback_used,
            "error_code": ai_payload.get("_error_code", "") if fallback_used else "",
        },
    }


def analyze_uploaded_image_payload(user, payload, image_file):
    """Analyse une image envoyee par le frontend sans creer de signalement.

    Ce flux sert a la page IA autonome. Le flux officiel de signalement continue
    d'utiliser `apps.ai.services.analyze_signalement`, qui persiste la photo,
    extrait les metadonnees EXIF et detecte les doublons.
    """
    started = time.monotonic()
    try:
        context = build_platform_context(user)
    except DatabaseError:
        record_ai_operation(
            user=user,
            operation="image_analysis",
            started=started,
            success=False,
            error_code="database_unavailable",
            fallback_used=False,
            metadata={"has_image": True, "image_size": getattr(image_file, "size", 0)},
        )
        return {
            "success": False,
            "error_code": "database_unavailable",
            "analysis": None,
            "image": {
                "name": getattr(image_file, "name", ""),
                "size": getattr(image_file, "size", 0),
                "content_type": getattr(image_file, "content_type", ""),
            },
            "provider": provider_status(live=False),
            "meta": {"source": "error", "fallback_used": False},
        }
    image_context = {
        "name": getattr(image_file, "name", ""),
        "size": getattr(image_file, "size", 0),
        "content_type": getattr(image_file, "content_type", ""),
    }
    payload = {**payload, "image": image_context, "has_image": True}
    fallback = fallback_triage(payload)
    temp_path = ""
    provider = ""
    model = ""
    analysis = None
    error_code = ""

    try:
        suffix = os.path.splitext(image_context["name"] or "image.jpg")[1] or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_image:
            for chunk in image_file.chunks():
                temp_image.write(chunk)
            temp_path = temp_image.name

        generated = generate_with_best_provider(
            IMAGE_ANALYSIS_PROMPT,
            image_path=temp_path,
            text_context=json.dumps(
                {
                    "mission": "Analyse visuelle autonome ECO RDC Intelligence.",
                    "signalement": payload,
                    "context": context,
                },
                default=str,
                ensure_ascii=False,
            ),
        )
        if not generated:
            raise AIProviderUnavailable("Le provider IA n'a retourne aucune analyse image.")
        provider, model = provider_from_payload(generated)
        analysis = validate_signalement_analysis(generated or fallback, fallback=fallback)
    except AIError as exc:
        provider = ""
        model = ""
        error_code = exc.code
    except Exception:
        provider = ""
        model = ""
        error_code = "invalid_ai_response"
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

    if not provider:
        if not local_fallback_enabled():
            record_ai_operation(
                user=user,
                operation="image_analysis",
                started=started,
                success=False,
                provider=provider,
                model_name=model,
                error_code=error_code or "provider_unavailable",
                fallback_used=False,
                metadata={"has_image": True, "image_size": image_context.get("size")},
            )
            return {
                "success": False,
                "error_code": error_code or "provider_unavailable",
                "analysis": None,
                "image": image_context,
                "provider": context["provider"],
                "meta": {"source": "error", "fallback_used": False},
            }
        analysis = validate_signalement_analysis(fallback, fallback=fallback)
        record_ai_operation(
            user=user,
            operation="image_analysis",
            started=started,
            success=False,
            provider=provider,
            model_name=model,
            error_code=error_code or "provider_unavailable",
            fallback_used=True,
            metadata={"has_image": True, "image_size": image_context.get("size"), "gravity": analysis.get("gravite")},
        )
        return {
            "success": True,
            "error_code": error_code or "provider_unavailable",
            "analysis": analysis,
            "image": image_context,
            "provider": context["provider"],
            "meta": {"source": "local_fallback", "fallback_used": True, "error_code": error_code or "provider_unavailable"},
        }

    record_ai_operation(
        user=user,
        operation="image_analysis",
        started=started,
        success=bool(provider),
        provider=provider,
        model_name=model,
        error_code="" if provider else "provider_unavailable",
        fallback_used=not bool(provider),
        metadata={"has_image": True, "image_size": image_context.get("size"), "gravity": analysis.get("gravite")},
    )
    return {"success": True, "analysis": analysis, "image": image_context, "provider": context["provider"]}


def fallback_action_plan(context):
    counts = context["counts"]
    risk_name = (context.get("risk_zones") or [{"name": "la zone prioritaire"}])[0]["name"]
    return {
        "executive_summary": f"{counts['active']} dossier(s) actifs dont {counts['critical']} critique(s).",
        "priority_score": min(100, 45 + counts["critical"] * 15 + counts["active"] * 3),
        "actions": [
            {
                "title": f"Intervenir sur {risk_name}",
                "owner": "Autorite locale",
                "deadline": "24 heures si cas critique",
                "impact": "Reduction du risque environnemental immediat",
                "risk": "Retard terrain ou manque de preuve photo",
            },
            {
                "title": "Publier une information officielle",
                "owner": "Ministere ou administration",
                "deadline": "Aujourd'hui",
                "impact": "Citoyens mieux informes",
                "risk": "Message trop vague si non contextualise",
            },
        ],
        "notifications": ["Notifier citoyens concernes", "Alerter autorite de zone"],
        "publication_recommendation": "Publier une actualite courte avec consignes et contacts.",
    }


def fallback_triage(payload):
    text = f"{payload.get('title', '')} {payload.get('description', '')}".lower()
    category = "dechets"
    if "inond" in text or "pluie" in text:
        category = "inondation"
    elif "erosion" in text or "ravin" in text:
        category = "erosion"
    elif "caniveau" in text or "drain" in text:
        category = "caniveau bouche"
    gravity = "critique" if any(word in text for word in ["danger", "ecole", "hopital", "effondrement"]) else "eleve" if "urgent" in text else "moyen"
    resume = f"Pre-analyse ECO IA: {category}, gravite {gravity}."
    recommendation = "Ajouter une photo nette, confirmer la position GPS et transmettre a l'autorite competente."
    return {
        "categorie_detectee": category,
        "gravite": gravity,
        "urgence": "intervention immediate" if gravity == "critique" else "controle sous 72 heures",
        "resume": resume,
        "resume_court": resume,
        "description_amelioree": payload.get("description") or resume,
        "risques_detectes": [
            "aggravation possible si la situation reste non traitee",
            "recurrence locale probable si la source du probleme n'est pas supprimee",
        ],
        "recommandation": recommendation,
        "recommandation_autorite": recommendation,
        "recommandation_citoyen": "Eviter la zone, documenter l'evolution et suivre les notifications officielles.",
        "delai_intervention_recommande": "24 heures" if gravity in {"critique", "eleve"} else "72 heures",
        "coherence_image_description": "a verifier avec la photo et la position",
        "priorite_traitement": "haute" if gravity in {"critique", "eleve"} else "normale",
        "notification_a_envoyer": gravity in {"critique", "eleve"},
        "risques_predictifs": [
            "aggravation possible si la situation reste non traitee",
            "recurrence locale probable si la source du probleme n'est pas supprimee",
        ],
        "actions_preventives": [
            "securiser la zone signalee",
            "programmer une verification terrain avec preuve photo",
        ],
        "conseils_publics": [
            "eviter tout contact direct avec la zone a risque",
            "publier une information locale si plusieurs citoyens sont exposes",
        ],
        "publication_recommandee": {
            "type": "conseil",
            "titre": f"Prevention environnementale - {category}",
            "resume": "Informer les citoyens et demander des preuves complementaires si necessaire.",
        },
        "score_confiance": 68,
        "questions_a_completer": ["La photo montre-t-elle clairement le probleme ?", "La position GPS est-elle correcte ?"],
    }
