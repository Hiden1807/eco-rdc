from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        CITOYEN = "citoyen", "Citoyen"
        AUTORITE = "autorite", "Autorite"
        MINISTERE = "ministere", "Ministere"
        ADMIN = "admin", "Admin"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CITOYEN, db_index=True)
    phone = models.CharField(max_length=32, blank=True)
    avatar = models.ImageField(upload_to="users/", blank=True, null=True)
    organization = models.CharField(max_length=160, blank=True)
    address_line = models.CharField(max_length=220, blank=True)
    province = models.ForeignKey("locations.Province", on_delete=models.SET_NULL, null=True, blank=True)
    commune = models.ForeignKey("locations.Commune", on_delete=models.SET_NULL, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_citizen(self):
        return self.role == self.Role.CITOYEN

    @property
    def is_authority(self):
        return self.role == self.Role.AUTORITE

    @property
    def is_ministry(self):
        return self.role == self.Role.MINISTERE

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"
