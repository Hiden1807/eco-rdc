# Deploiement Production ECO RDC Intelligence

Ce projet peut etre mis en ligne avec Docker sur un VPS, un serveur cloud ou une plateforme qui accepte Docker Compose.

## 1. Preparer les variables

```bash
cp backend/.env.production.example backend/.env.production
cp frontend/.env.production.example frontend/.env.production
```

Renseigner:

- `SECRET_KEY`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `OPENROUTER_API_KEY` ou `GEMINI_API_KEY`
- `VITE_API_URL`
- `VITE_STAFF_PORTAL_PATH`

## 2. Construire et lancer

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 3. Initialiser Django

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml exec backend python manage.py seed_reference_data
docker compose -f docker-compose.prod.yml exec backend python manage.py bootstrap_admin
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

## 4. Verifier

```bash
curl https://your-domain.com/api/health/
```

Reponse attendue:

```json
{"status":"ok","service":"eco-rdc-api"}
```

## Checklist Production

- HTTPS actif.
- `DEBUG=False`.
- aucune cle IA dans le frontend.
- `DB_ENGINE=mysql` et volume `mysql_data` actif.
- migrations Django executees sur MySQL.
- comptes autorite, ministere et admin crees uniquement par admin.
- chemin institutionnel change avant mise en ligne via `VITE_STAFF_PORTAL_PATH`.
- permissions API verifiees pour publications, IA, notifications et comptes officiels.
- sauvegarde MySQL planifiee.
- stockage media persistant.
- logs surveilles.
- nom de domaine configure.
