from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("publications", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="officialpublication",
            name="cover_image",
            field=models.ImageField(blank=True, null=True, upload_to="publications/images/"),
        ),
        migrations.AddField(
            model_name="officialpublication",
            name="attachment_pdf",
            field=models.FileField(blank=True, null=True, upload_to="publications/pdfs/"),
        ),
        migrations.AddField(
            model_name="officialpublication",
            name="video_url",
            field=models.URLField(blank=True),
        ),
    ]
