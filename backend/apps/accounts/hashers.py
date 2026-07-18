from django.contrib.auth.hashers import PBKDF2PasswordHasher


class LocalFastPBKDF2PasswordHasher(PBKDF2PasswordHasher):
    """Hasher plus rapide uniquement pour le developpement local.

    La production garde les hashers Django standards. En local, les iterations
    par defaut peuvent rendre l'inscription/login trop lents sur certaines
    machines Windows et provoquer des timeouts navigateur.
    """

    iterations = 120_000
