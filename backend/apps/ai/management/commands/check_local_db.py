from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connections


class Command(BaseCommand):
    help = "Diagnostique rapidement la base locale configuree pour Django."

    def handle(self, *args, **options):
        database = settings.DATABASES["default"]
        engine = database.get("ENGINE", "")
        host = database.get("HOST", "")
        port = database.get("PORT", "")
        name = database.get("NAME", "")

        self.stdout.write(f"Engine: {engine}")
        self.stdout.write(f"Database: {name}")
        if host or port:
            self.stdout.write(f"Host: {host or '(local)'}")
            self.stdout.write(f"Port: {port or '(default)'}")

        try:
            with connections["default"].cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception as exc:  # noqa: BLE001 - diagnostic command
            raise CommandError(
                "Connexion base impossible. "
                "Demarre MySQL/MariaDB/WAMP ou corrige DB_ENGINE, MYSQL_HOST et MYSQL_PORT dans backend/.env. "
                f"Erreur: {exc}"
            ) from exc

        self.stdout.write(self.style.SUCCESS("Connexion base OK."))
