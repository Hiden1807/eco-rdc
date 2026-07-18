import uuid

from django.conf import settings
from django.db import models

from .json_safety import make_json_safe


class AIAnalysis(models.Model):
    """Analyse persistante rattachee a un signalement officiel.

    Ce modele reste le resultat metier principal: il alimente les tableaux de
    bord, les fiches signalement et les preuves d'analyse deja visibles dans
    l'application.
    """

    signalement = models.OneToOneField("signalements.Signalement", on_delete=models.CASCADE, related_name="analysis")
    category_detected = models.CharField(max_length=120)
    gravity = models.CharField(max_length=20)
    urgency = models.CharField(max_length=120)
    summary = models.TextField()
    recommendation = models.TextField()
    confidence_score = models.PositiveSmallIntegerField(default=0)
    coherence = models.CharField(max_length=40, default="moyenne")
    intervention_type = models.CharField(max_length=120, blank=True)
    priority_level = models.CharField(max_length=80, blank=True)
    recommended_delay = models.CharField(max_length=80, blank=True)
    suggested_team = models.CharField(max_length=120, blank=True)
    duplicate_probability = models.PositiveSmallIntegerField(default=0)
    fraud_flags = models.JSONField(default=list, blank=True)
    raw_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Analyse IA #{self.pk} - {self.category_detected}"

    def save(self, *args, **kwargs):
        self.fraud_flags = make_json_safe(self.fraud_flags)
        self.raw_response = make_json_safe(self.raw_response)
        super().save(*args, **kwargs)


class AIConversation(models.Model):
    """Fil de discussion entre un utilisateur et ECO IA.

    La conversation conserve une memoire courte cote backend. Le frontend ne
    garde donc qu'un identifiant, tandis que les messages et le role reel de
    l'utilisateur restent controles par Django.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ai_conversations")
    role_at_creation = models.CharField(max_length=32, blank=True)
    page_context = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [models.Index(fields=["user", "-updated_at"], name="ai_conv_user_updated_idx")]

    def __str__(self):
        return f"Conversation IA {self.id} ({self.user_id})"


class AIMessage(models.Model):
    """Message individuel d'une conversation IA.

    On stocke aussi le role de l'utilisateur au moment du message afin de
    garder une trace fiable meme si son role change plus tard.
    """

    ROLE_CHOICES = (("user", "Utilisateur"), ("assistant", "Assistant"), ("system", "Systeme"))

    conversation = models.ForeignKey(AIConversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    role_of_user_at_message = models.CharField(max_length=32, blank=True)
    content = models.TextField()
    intent = models.CharField(max_length=40, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["conversation", "created_at"], name="ai_msg_conv_created_idx")]

    def __str__(self):
        return f"{self.role}: {self.content[:50]}"

    def save(self, *args, **kwargs):
        self.metadata = make_json_safe(self.metadata)
        super().save(*args, **kwargs)


class AIAnalysisLog(models.Model):
    """Journal technique de toutes les operations IA.

    Ce journal ne stocke jamais de cle API. Il sert a diagnostiquer les appels
    lents, les quotas, les retours locaux et les pannes fournisseur.
    """

    OPERATION_CHOICES = (
        ("assistant", "Assistant"),
        ("image_analysis", "Analyse image"),
        ("risk_prediction", "Prediction risque"),
        ("report_generation", "Generation rapport"),
        ("education_generation", "Generation education"),
        ("publication_draft", "Brouillon publication"),
        ("signalement_triage", "Triage signalement"),
        ("health_check", "Sante IA"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="ai_logs")
    operation = models.CharField(max_length=40, choices=OPERATION_CHOICES)
    provider = models.CharField(max_length=40, blank=True)
    model_name = models.CharField(max_length=120, blank=True)
    target_type = models.CharField(max_length=64, blank=True)
    target_id = models.CharField(max_length=64, blank=True)
    success = models.BooleanField(default=False)
    error_code = models.CharField(max_length=64, blank=True)
    fallback_used = models.BooleanField(default=False)
    duration_ms = models.PositiveIntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["operation", "-created_at"], name="ai_log_oper_created_idx"),
            models.Index(fields=["success", "-created_at"], name="ai_log_success_created_idx"),
        ]

    def __str__(self):
        status = "OK" if self.success else f"FAIL:{self.error_code or 'unknown'}"
        return f"{self.operation} [{status}]"

    def save(self, *args, **kwargs):
        self.metadata = make_json_safe(self.metadata)
        super().save(*args, **kwargs)


class AIInsight(models.Model):
    """Insight proactif calcule par ECO IA pour un role ou un territoire."""

    LEVEL_CHOICES = (("info", "Information"), ("attention", "Attention"), ("critique", "Critique"))

    title = models.CharField(max_length=255)
    description = models.TextField()
    level = models.CharField(max_length=16, choices=LEVEL_CHOICES, default="info")
    target_role = models.CharField(max_length=32, blank=True)
    territory_scope = models.CharField(max_length=128, blank=True)
    source_operation = models.CharField(max_length=40, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["target_role", "is_active", "-created_at"], name="ai_insight_role_active_idx")]

    def __str__(self):
        return f"[{self.level}] {self.title}"


class AINotificationRule(models.Model):
    """Trace les declenchements automatiques de notifications IA.

    Le modele permet de comprendre pourquoi une notification critique ou une
    alerte de zone a risque a ete envoyee, sans dupliquer le modele
    Notification principal.
    """

    rule_code = models.CharField(max_length=64)
    target_type = models.CharField(max_length=64, blank=True)
    target_id = models.CharField(max_length=64, blank=True)
    recipients_summary = models.CharField(max_length=255, blank=True)
    payload = models.JSONField(default=dict, blank=True)
    triggered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-triggered_at"]
        indexes = [models.Index(fields=["rule_code", "target_type", "target_id", "-triggered_at"], name="ai_rule_target_idx")]

    def __str__(self):
        return f"{self.rule_code} -> {self.target_type}:{self.target_id}"

    def save(self, *args, **kwargs):
        self.payload = make_json_safe(self.payload)
        super().save(*args, **kwargs)
