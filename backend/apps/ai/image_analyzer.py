from .prompts import IMAGE_ANALYSIS_PROMPT
from .gemini import generate_with_best_provider
from .services import analyze_signalement, apply_ai_analysis, extract_exif_metadata


def analyze_image_signalement(signalement):
    ai_payload = generate_with_best_provider(
        IMAGE_ANALYSIS_PROMPT,
        image_path=signalement.photo.path if signalement.photo else None,
        text_context=f"Titre: {signalement.title}\nDescription: {signalement.description}",
    )
    if ai_payload:
        ai_payload["exif"] = extract_exif_metadata(signalement.photo.path) if signalement.photo else {}
        return ai_payload
    return analyze_signalement(signalement)


def analyze_and_apply(signalement):
    return apply_ai_analysis(signalement, analyze_image_signalement(signalement))
