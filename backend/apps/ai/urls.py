from django.urls import path

from .views import (
    AIActionPlanView,
    AIGenerateEducationContentView,
    AIGenerateReportView,
    AIPredictiveBriefingView,
    AIPublicationDraftView,
    AIRiskPredictionView,
    AISignalementTriageView,
    MinistryAssistantView,
    PublicAIHealthView,
)


urlpatterns = [
    path("assistant/", MinistryAssistantView.as_view(), name="ai-assistant"),
    path("action-plan/", AIActionPlanView.as_view(), name="ai-action-plan"),
    path("publication-draft/", AIPublicationDraftView.as_view(), name="ai-publication-draft"),
    path("signalement-triage/", AISignalementTriageView.as_view(), name="ai-signalement-triage"),
    path("predictive-briefing/", AIPredictiveBriefingView.as_view(), name="ai-predictive-briefing"),
    path("predict-risk/", AIRiskPredictionView.as_view(), name="ai-predict-risk"),
    path("generate-report/", AIGenerateReportView.as_view(), name="ai-generate-report"),
    path("generate-education-content/", AIGenerateEducationContentView.as_view(), name="ai-generate-education-content"),
    path("health/", PublicAIHealthView.as_view(), name="ai-health"),
]
