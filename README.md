# ECO RDC Intelligence

Plateforme web intelligente, institutionnelle et deployable pour la gestion environnementale en RDC, avec Kinshasa comme premier perimetre.

## Apercu

ECO RDC Intelligence relie citoyens, autorites locales, ministere et administrateurs autour d'un meme systeme:

- signalements citoyens avec photo et geolocalisation;
- analyse IA cote backend avec Gemini pour l'assistant, le triage et les images;
- detection EXIF, coherence photo/description, doublons, priorite et urgence;
- alertes officielles par commune/province;
- notifications dynamiques;
- centre d'education avec articles, PDF, videos, campagnes et communiques;
- dashboards citoyen, autorite, ministere et admin;
- carte OpenStreetMap avec filtres, heatmap, zones critiques et details;
- preuve avant/apres resolution;
- rapports PDF/Excel et assistant IA contextualise;
- centre de publication officiel pour actualites, education, communiques et mises a disposition;
- entree institutionnelle configurable et non referencee publiquement;
- PWA, theme clair/sombre et file offline partielle.

## Structure

```text
backend/       API Django REST, JWT, IA, alertes, rapports, modeles metier
frontend/      Application React/Vite/Tailwind responsive et premium
database/      Aide SQL locale et reference historique; Django migrate reste prioritaire
DEPLOYMENT.md  Guide de mise en ligne Docker
```

## Lancement Local Frontend

```bash
cd frontend
npm install
npm run dev
```

## Lancement Local Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_reference_data
python manage.py bootstrap_admin
python manage.py runserver
```

Copier `backend/.env.example` vers `backend/.env`, puis renseigner les variables necessaires.

### Base MariaDB/MySQL Locale Sans Docker

Django 4.2 LTS est utilise pour rester compatible avec MariaDB 10.4, version souvent fournie par XAMPP/WAMP.
Si Django 5.x est deja installe et que PyPI est momentanement inaccessible, `ALLOW_LEGACY_MARIADB_104=True`
permet aussi au backend de demarrer localement avec MariaDB 10.4.

1. Demarrer MySQL/MariaDB dans XAMPP, WAMP ou votre outil habituel.
2. Ouvrir phpMyAdmin, aller dans l'onglet SQL, puis executer `database/local_mariadb_setup.sql`.
   Ne pas importer `database/schema.sql` dans une base deja migree par Django.
3. Verifier que `backend/.env` contient:

```text
DB_ENGINE=mysql
ALLOW_LEGACY_MARIADB_104=True
MYSQL_DATABASE=eco_rdc_intelligence
MYSQL_USER=eco_rdc
MYSQL_PASSWORD=eco_rdc_local_password
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
```

4. Relancer les dependances puis les migrations:

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_reference_data
python manage.py bootstrap_admin
python manage.py runserver
```

## Production

Le projet contient une configuration pour mise en ligne rapide:

- `DEPLOYMENT.md`
- `docker-compose.prod.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `backend/.env.production.example`
- `frontend/.env.production.example`

Commandes principales:

```bash
cp backend/.env.production.example backend/.env.production
cp frontend/.env.production.example frontend/.env.production
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml exec backend python manage.py bootstrap_admin
```

Health check:

```text
/api/health/
```

## IA Production

Provider IA:

1. Gemini est le provider configure cote backend.
2. Les rapports et publications ne dependent plus de l'IA generative.
3. Le fallback local IA est desactive par defaut avec `AI_ALLOW_LOCAL_FALLBACK=False`.

Aucune cle IA ne doit etre placee dans le frontend.

Creer les cles IA depuis les plateformes officielles, puis les placer uniquement dans `backend/.env` ou `backend/.env.production`:

- Gemini: https://ai.google.dev/gemini-api/docs/api-key

## Regles De Comptes

- Le citoyen peut s'inscrire publiquement.
- Les comptes autorite, ministere et admin doivent etre crees par l'administrateur.
- L'entree institutionnelle n'est pas liee depuis le portail public et se configure avec `VITE_STAFF_PORTAL_PATH`.
- Les routes API utilisent JWT et permissions par role.
- Les secrets restent dans `.env` ou `.env.production`.

## Acces Administrateur

- Interface institutionnelle React: `http://127.0.0.1:5173/eco-rdc-institutional-gateway`
- Administration Django: `http://127.0.0.1:8000/admin/`
- Creer le premier admin avec `python manage.py bootstrap_admin` apres avoir renseigne `DJANGO_SUPERUSER_PASSWORD`.

## Parcours Demo Ideal

1. Un citoyen entre sur le site public.
2. Il lit une alerte officielle.
3. Il cree un compte citoyen.
4. Il fait un signalement avec photo.
5. Le systeme detecte sa position.
6. L'IA analyse photo et texte.
7. Le signalement apparait sur la carte.
8. L'autorite recoit une notification.
9. L'autorite traite et ajoute une preuve apres intervention.
10. Le ministere consulte le dashboard national.
11. L'assistant IA resume la situation de Kinshasa.
12. Le ministere genere un rapport PDF.
