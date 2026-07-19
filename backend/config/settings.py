from datetime import timedelta
import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DEBUG = os.getenv("DEBUG", "True").lower() == "true"
SECRET_KEY = os.getenv("SECRET_KEY", "eco-rdc-dev-secret-key-local-development-only")
if len(SECRET_KEY.encode("utf-8")) < 32:
    if DEBUG:
        SECRET_KEY = f"{SECRET_KEY}-local-development-padding-eco-rdc-2026"
    else:
        raise RuntimeError("SECRET_KEY must be at least 32 bytes in production.")
ALLOWED_HOSTS = [host.strip() for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if host.strip()]
ALLOW_DEMO_AI = DEBUG and os.getenv("ALLOW_DEMO_AI", "False").lower() == "true"
ALLOW_LEGACY_MARIADB_104 = os.getenv("ALLOW_LEGACY_MARIADB_104", "True" if DEBUG else "False").lower() == "true"


def env_bool(name, default=False):
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "oui", "on"}


def env_int(name, default):
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return int(default)


def env_float(name, default):
    try:
        return float(os.getenv(name, default))
    except (TypeError, ValueError):
        return float(default)


AI_ENABLED = env_bool("AI_ENABLED", True)
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini").strip().lower() or "gemini"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
AI_TIMEOUT_SECONDS = env_int("AI_TIMEOUT_SECONDS", 60)
AI_MAX_RETRIES = env_int("AI_MAX_RETRIES", 2)
AI_TEMPERATURE = env_float("AI_TEMPERATURE", 0.4)
AI_MAX_OUTPUT_TOKENS = env_int("AI_MAX_OUTPUT_TOKENS", os.getenv("AI_MAX_TOKENS", 4096))
AI_DEBUG = env_bool("AI_DEBUG", False)
AI_HEALTH_CHECK_LIVE = env_bool("AI_HEALTH_CHECK_LIVE", False)
AI_ALLOW_LOCAL_FALLBACK = env_bool("AI_ALLOW_LOCAL_FALLBACK", False)

INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "cloudinary_storage",
    "cloudinary",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "django_filters",
    "apps.accounts",
    "apps.locations",
    "apps.signalements",
    "apps.ai",
    "apps.dashboard",
    "apps.education",
    "apps.publications",
    "apps.notifications",
    "apps.alerts",
    "apps.reports",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

if os.getenv("DATABASE_URL"):
    import dj_database_url
    DATABASES = {
        "default": dj_database_url.config(
            default=os.getenv("DATABASE_URL"),
            conn_max_age=600,
            ssl_require=True,
        )
    }
elif os.getenv("DB_ENGINE", "sqlite").lower() == "mysql":
    import pymysql

    pymysql.install_as_MySQLdb()
    if ALLOW_LEGACY_MARIADB_104:
        from django.db.backends.mysql.features import DatabaseFeatures

        def local_minimum_database_version(self):
            """Allow local XAMPP/WAMP MariaDB 10.4 while keeping MySQL 8.x checks intact."""
            if self.connection.mysql_is_mariadb:
                return (10, 4)
            return (8, 0, 11)

        def local_can_return_columns_from_insert(self):
            """Disable INSERT RETURNING on MariaDB 10.4 because it was added later."""
            if self.connection.mysql_is_mariadb and self.connection.mysql_version < (10, 5):
                return False
            return self.connection.mysql_is_mariadb

        DatabaseFeatures.minimum_database_version = property(local_minimum_database_version)
        DatabaseFeatures.can_return_columns_from_insert = property(local_can_return_columns_from_insert)
        DatabaseFeatures.can_return_rows_from_bulk_insert = property(lambda self: self.can_return_columns_from_insert)

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": os.getenv("MYSQL_DATABASE", "eco_rdc_intelligence"),
            "USER": os.getenv("MYSQL_USER", "root"),
            "PASSWORD": os.getenv("MYSQL_PASSWORD", ""),
            "HOST": os.getenv("MYSQL_HOST", "127.0.0.1"),
            "PORT": os.getenv("MYSQL_PORT", "3306"),
            "CONN_MAX_AGE": env_int("MYSQL_CONN_MAX_AGE", 0),
            "OPTIONS": {
                "charset": "utf8mb4",
                "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
                "connect_timeout": env_int("MYSQL_CONNECT_TIMEOUT", 10),
                "read_timeout": env_int("MYSQL_READ_TIMEOUT", 120),
                "write_timeout": env_int("MYSQL_WRITE_TIMEOUT", 120),
            },
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

if DEBUG and env_bool("FAST_LOCAL_PASSWORD_HASHING", True):
    PASSWORD_HASHERS = [
        "apps.accounts.hashers.LocalFastPBKDF2PasswordHasher",
        "django.contrib.auth.hashers.PBKDF2PasswordHasher",
        "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
        "django.contrib.auth.hashers.Argon2PasswordHasher",
        "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
        "django.contrib.auth.hashers.ScryptPasswordHasher",
    ]

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Kinshasa"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.StaticFilesStorage"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "False").lower() == "true"
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "0" if DEBUG else "31536000"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG and SECURE_HSTS_SECONDS > 0
SECURE_HSTS_PRELOAD = not DEBUG and SECURE_HSTS_SECONDS > 0
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
X_FRAME_OPTIONS = "DENY"
SECURE_CONTENT_TYPE_NOSNIFF = True
REFERRER_POLICY = "same-origin"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=45),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

DATA_UPLOAD_MAX_MEMORY_SIZE = 8 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 8 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf"}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}
