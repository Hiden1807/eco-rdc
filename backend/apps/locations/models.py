from django.db import models


class Province(models.Model):
    name = models.CharField(max_length=120, unique=True)
    code = models.CharField(max_length=16, unique=True)
    centroid_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    centroid_longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    ecological_score = models.PositiveSmallIntegerField(default=72)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Commune(models.Model):
    province = models.ForeignKey(Province, on_delete=models.PROTECT, related_name="communes")
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=24, unique=True)
    centroid_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    centroid_longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    ecological_score = models.PositiveSmallIntegerField(default=70, db_index=True)
    risk_level = models.CharField(max_length=20, default="modere", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["province__name", "name"]
        constraints = [models.UniqueConstraint(fields=["province", "name"], name="unique_commune_per_province")]
        indexes = [models.Index(fields=["province", "risk_level"])]

    def __str__(self):
        return f"{self.name}, {self.province.name}"

