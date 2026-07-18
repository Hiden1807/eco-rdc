"""Endpoints HTTP exposant le coeur IA ECO RDC.

Les vues restent volontairement fines: elles verifient les permissions et
normalisent les donnees entrantes, puis deleguent l'intelligence metier aux
services `intelligence.py` et `predictive.py`.
"""

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai.engine import provider_status
from apps.ai.education_generator import generate_education_content_draft
from apps.ai.exceptions import AIError
from apps.ai.intelligence import (
    analyze_uploaded_image_payload,
    answer_copilot_question,
    generate_action_plan,
    triage_signalement_payload,
)
from apps.ai.permissions import IsAuthenticatedOrDemoAI, get_ai_request_user
from apps.ai.predictive import predictive_briefing
from apps.ai.risk_predictor import predict_risk
from apps.education.models import EducationalContent
from apps.education.serializers import EducationalContentSerializer
from apps.reports.serializers import ReportGenerateSerializer, ReportSerializer
from apps.reports.services import generate_report as generate_platform_report


class MinistryAssistantView(APIView):
    permission_classes = [IsAuthenticatedOrDemoAI]

    def post(self, request):
        question = request.data.get("question", "").strip()
        if not question:
            return Response({"detail": "La question est obligatoire."}, status=400)
        result = answer_copilot_question(
            question,
            get_ai_request_user(request),
            conversation_id=request.data.get("conversation_id"),
            page_context=request.data.get("page_context", ""),
        )
        return Response(result, status=200 if result.get("success") else 503)


class AIActionPlanView(APIView):
    permission_classes = [IsAuthenticatedOrDemoAI]

    def post(self, request):
        objective = request.data.get("objective", "prioriser les interventions").strip()
        try:
            return Response(generate_action_plan(get_ai_request_user(request), objective=objective))
        except AIError as exc:
            return Response({"success": False, "error_code": exc.code, "detail": "ECO IA est temporairement indisponible."}, status=503)


class AIPublicationDraftView(APIView):
    permission_classes = [IsAuthenticatedOrDemoAI]

    def post(self, request):
        return Response(
            {
                "success": False,
                "error_code": "publication_ai_disabled",
                "detail": "La generation IA des publications est desactivee. Les publications doivent etre redigees et validees par un humain.",
            },
            status=410,
        )


class AISignalementTriageView(APIView):
    permission_classes = [IsAuthenticatedOrDemoAI]

    def post(self, request):
        # Le meme endpoint accepte soit un JSON texte, soit un multipart avec
        # image. Le frontend peut donc pre-analyser une photo sans creer encore
        # un signalement officiel.
        image = request.FILES.get("image") or request.FILES.get("photo") or request.FILES.get("file")
        payload = {
            key: request.data.get(key)
            for key in request.data.keys()
            if key not in {"image", "photo", "file"}
        }
        user = get_ai_request_user(request)
        if image:
            result = analyze_uploaded_image_payload(user, payload, image)
            return Response(result, status=200 if result.get("success") else 503)
        result = triage_signalement_payload(user, payload)
        return Response(result, status=200 if result.get("success") else 503)


class AIPredictiveBriefingView(APIView):
    permission_classes = [IsAuthenticatedOrDemoAI]

    def get(self, request):
        days = int(request.query_params.get("days", 7))
        return Response(predictive_briefing(days=days))


class AIRiskPredictionView(APIView):
    permission_classes = [IsAuthenticatedOrDemoAI]

    def get(self, request):
        days = int(request.query_params.get("days", 7))
        commune_id = request.query_params.get("commune_id")
        return Response(predict_risk(days=days, commune_id=commune_id))

    def post(self, request):
        days = int(request.data.get("days", 7))
        commune_id = request.data.get("commune_id")
        return Response(predict_risk(days=days, commune_id=commune_id))


class AIGenerateReportView(APIView):
    permission_classes = [IsAuthenticatedOrDemoAI]

    def post(self, request):
        user = get_ai_request_user(request)
        if user.role not in {"ministere", "admin"}:
            return Response({"detail": "Generation de rapport reservee au ministere et a l'administration."}, status=403)
        serializer = ReportGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report_type = serializer.validated_data["report_type"]
        title = serializer.validated_data.get("title", "")
        report = generate_platform_report(report_type, user, title=title)
        return Response(
            {
                "success": True,
                "source": "platform_data",
                "report": ReportSerializer(report, context={"request": request}).data,
                "analysis": report.chart_payload,
                "prediction": (report.chart_payload or {}).get("predictive", {}),
            },
            status=201,
        )


class AIGenerateEducationContentView(APIView):
    permission_classes = [IsAuthenticatedOrDemoAI]

    def post(self, request):
        user = get_ai_request_user(request)
        if user.role not in {"autorite", "ministere", "admin"}:
            return Response({"detail": "Generation de contenus reservee aux comptes officiels."}, status=403)
        theme = request.data.get("theme", "").strip()
        if not theme:
            return Response({"detail": "Le theme est obligatoire."}, status=400)
        try:
            result = generate_education_content_draft(
                user,
                theme=theme,
                public_cible=request.data.get("public_cible", "citoyens"),
                niveau=request.data.get("niveau", "simple"),
            )
        except AIError as exc:
            return Response({"success": False, "error_code": exc.code, "detail": "ECO IA est temporairement indisponible."}, status=503)
        content = EducationalContent.objects.get(id=result["content_id"])
        return Response(
            {
                "success": True,
                **result,
                "content": EducationalContentSerializer(content, context={"request": request}).data,
            },
            status=201,
        )


class PublicAIHealthView(APIView):
    permission_classes = [IsAuthenticatedOrDemoAI]

    def get(self, request):
        live_param = str(request.query_params.get("live", "")).lower()
        live = live_param in {"1", "true", "yes", "oui"}
        status = provider_status(live=live)
        http_status = 200 if status.get("status") in {"available", "configured"} else 503
        return Response(status, status=http_status)
