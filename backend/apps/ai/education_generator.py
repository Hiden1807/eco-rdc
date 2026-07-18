"""Generation de contenus educatifs en brouillon."""

import json
import time

from django.utils import timezone
from django.utils.text import slugify

from apps.ai.audit import provider_from_payload, record_ai_operation
from apps.ai.engine import generate_json
from apps.ai.exceptions import AIProviderUnavailable
from apps.ai.prompts import GLOBAL_SYSTEM_PROMPT
from apps.education.models import EducationalContent


def _unique_slug(title):
    base = slugify(title)[:160] or "contenu-eco-ia"
    slug = base
    index = 2
    while EducationalContent.objects.filter(slug=slug).exists():
        slug = f"{base}-{index}"
        index += 1
    return slug


def generate_education_content_draft(user, theme, public_cible="citoyens", niveau="simple"):
    started = time.monotonic()
    fallback = {
        "titre": f"Conseils environnementaux - {theme or 'ECO RDC'}",
        "resume": f"Guide pratique pour {public_cible} sur {theme}.",
        "contenu": (
            f"ECO IA recommande d'identifier les risques lies a {theme}, de signaler les cas avec photo "
            "et de suivre les consignes des autorites locales."
        ),
        "categorie": theme or "education environnementale",
        "conseils": [
            "Garder une preuve photo claire.",
            "Eviter les zones dangereuses.",
            "Signaler rapidement toute aggravation.",
        ],
    }
    payload = generate_json(
        GLOBAL_SYSTEM_PROMPT,
        json.dumps(
            {
                "mission": "Generer un contenu educatif environnemental ECO RDC en francais.",
                "theme": theme,
                "public_cible": public_cible,
                "niveau": niveau,
                "schema": {"titre": "", "resume": "", "contenu": "", "categorie": "", "conseils": []},
            },
            ensure_ascii=False,
        ),
        fallback=fallback,
        temperature=0.25,
    )
    provider, model = provider_from_payload(payload)
    success = bool(provider)
    if not success:
        error_code = payload.get("_error_code", "provider_unavailable")
        record_ai_operation(
            user=user,
            operation="education_generation",
            started=started,
            success=False,
            provider="",
            model_name="",
            error_code=error_code,
            fallback_used=False,
            metadata={"theme": theme, "public_cible": public_cible, "niveau": niveau},
        )
        raise AIProviderUnavailable("Generation de contenu educatif IA indisponible.", error_code=error_code)
    title = payload.get("titre") or fallback["titre"]
    content = EducationalContent.objects.create(
        title=title,
        slug=_unique_slug(title),
        content_type=EducationalContent.ContentType.ARTICLE,
        topic=payload.get("categorie") or theme or "education environnementale",
        excerpt=payload.get("resume") or fallback["resume"],
        body=payload.get("contenu") or fallback["contenu"],
        status=EducationalContent.Status.DRAFT,
        is_official=True,
        is_featured=False,
        is_ai_generated=True,
        is_published=False,
        author=user if getattr(user, "is_authenticated", False) and getattr(user, "id", 0) else None,
        approved_by=None,
        published_at=None,
    )
    record_ai_operation(
        user=user,
        operation="education_generation",
        started=started,
        success=success,
        provider=provider,
        model_name=model,
        target_type="education",
        target_id=content.id,
        error_code="" if success else "provider_unavailable",
        fallback_used=not success,
        metadata={"theme": theme, "public_cible": public_cible, "niveau": niveau},
    )
    return {"draft": payload, "content_id": content.id, "status": content.status, "created_at": timezone.localtime(content.created_at)}
