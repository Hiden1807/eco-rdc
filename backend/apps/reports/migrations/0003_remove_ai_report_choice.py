from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("reports", "0002_alter_report_report_type"),
    ]

    operations = [
        migrations.AlterField(
            model_name="report",
            name="report_type",
            field=models.CharField(
                choices=[
                    ("daily", "Journalier"),
                    ("weekly", "Hebdomadaire"),
                    ("monthly", "Mensuel"),
                    ("commune", "Par commune"),
                    ("province", "Par province"),
                    ("national", "National"),
                    ("urgence", "Urgence"),
                    ("performance", "Performance"),
                    ("recommandations", "Recommandations"),
                ],
                db_index=True,
                max_length=20,
            ),
        ),
    ]
