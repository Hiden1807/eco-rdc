import time

from django.core.management.base import BaseCommand, CommandError

from apps.ai.exceptions import AIError
from apps.ai.providers.base import AIMessage
from apps.ai.providers.provider_factory import get_provider


class Command(BaseCommand):
    help = "Teste le provider IA configure sans jamais afficher la cle API."

    def handle(self, *args, **options):
        provider = get_provider()
        self.stdout.write(f"Provider: {provider.name}")
        self.stdout.write(f"Modele: {getattr(provider, 'model', '') or 'non_configure'}")
        self.stdout.write(f"Cle configuree: {'oui' if getattr(provider, 'api_key', '') else 'non'}")

        started = time.monotonic()
        try:
            result = provider.generate_text(
                [AIMessage(role="user", content="Reponds uniquement par : ECO IA CONNECTEE")],
                temperature=0,
                max_output_tokens=128,
            )
        except AIError as exc:
            raise CommandError(f"{exc.code}: {exc.message}") from exc

        duration_ms = int((time.monotonic() - started) * 1000)
        self.stdout.write(f"Temps de reponse: {duration_ms} ms")
        self.stdout.write(f"Reponse: {result.text.strip()}")
        self.stdout.write(self.style.SUCCESS("Test provider termine."))
