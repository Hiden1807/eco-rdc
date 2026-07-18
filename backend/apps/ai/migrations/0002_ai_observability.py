import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("ai", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AIConversation",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("role_at_creation", models.CharField(blank=True, max_length=32)),
                ("page_context", models.CharField(blank=True, max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_archived", models.BooleanField(default=False)),
                (
                    "user",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="ai_conversations", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={
                "ordering": ["-updated_at"],
            },
        ),
        migrations.CreateModel(
            name="AIInsight",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField()),
                (
                    "level",
                    models.CharField(choices=[("info", "Information"), ("attention", "Attention"), ("critique", "Critique")], default="info", max_length=16),
                ),
                ("target_role", models.CharField(blank=True, max_length=32)),
                ("territory_scope", models.CharField(blank=True, max_length=128)),
                ("source_operation", models.CharField(blank=True, max_length=40)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="AINotificationRule",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("rule_code", models.CharField(max_length=64)),
                ("target_type", models.CharField(blank=True, max_length=64)),
                ("target_id", models.CharField(blank=True, max_length=64)),
                ("recipients_summary", models.CharField(blank=True, max_length=255)),
                ("payload", models.JSONField(blank=True, default=dict)),
                ("triggered_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["-triggered_at"],
            },
        ),
        migrations.CreateModel(
            name="AIMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(choices=[("user", "Utilisateur"), ("assistant", "Assistant"), ("system", "Systeme")], max_length=16)),
                ("role_of_user_at_message", models.CharField(blank=True, max_length=32)),
                ("content", models.TextField()),
                ("intent", models.CharField(blank=True, max_length=40)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "conversation",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="ai.aiconversation"),
                ),
            ],
            options={
                "ordering": ["created_at"],
            },
        ),
        migrations.CreateModel(
            name="AIAnalysisLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "operation",
                    models.CharField(
                        choices=[
                            ("assistant", "Assistant"),
                            ("image_analysis", "Analyse image"),
                            ("risk_prediction", "Prediction risque"),
                            ("report_generation", "Generation rapport"),
                            ("education_generation", "Generation education"),
                            ("publication_draft", "Brouillon publication"),
                            ("signalement_triage", "Triage signalement"),
                            ("health_check", "Sante IA"),
                        ],
                        max_length=40,
                    ),
                ),
                ("provider", models.CharField(blank=True, max_length=40)),
                ("model_name", models.CharField(blank=True, max_length=120)),
                ("target_type", models.CharField(blank=True, max_length=64)),
                ("target_id", models.CharField(blank=True, max_length=64)),
                ("success", models.BooleanField(default=False)),
                ("error_code", models.CharField(blank=True, max_length=64)),
                ("fallback_used", models.BooleanField(default=False)),
                ("duration_ms", models.PositiveIntegerField(default=0)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="ai_logs", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="aiconversation",
            index=models.Index(fields=["user", "-updated_at"], name="ai_conv_user_updated_idx"),
        ),
        migrations.AddIndex(
            model_name="aiinsight",
            index=models.Index(fields=["target_role", "is_active", "-created_at"], name="ai_insight_role_active_idx"),
        ),
        migrations.AddIndex(
            model_name="ainotificationrule",
            index=models.Index(fields=["rule_code", "target_type", "target_id", "-triggered_at"], name="ai_rule_target_idx"),
        ),
        migrations.AddIndex(
            model_name="aimessage",
            index=models.Index(fields=["conversation", "created_at"], name="ai_msg_conv_created_idx"),
        ),
        migrations.AddIndex(
            model_name="aianalysislog",
            index=models.Index(fields=["operation", "-created_at"], name="ai_log_oper_created_idx"),
        ),
        migrations.AddIndex(
            model_name="aianalysislog",
            index=models.Index(fields=["success", "-created_at"], name="ai_log_success_created_idx"),
        ),
    ]
