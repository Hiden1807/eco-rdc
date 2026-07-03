# 🔗 LIAISON_FRONT_BACK.md
## Documentation d'intégration Frontend ↔ Backend — EcoRDC Intelligence Platform

---

## 1. Architecture Globale

```
Frontend (React + Vite)          Backend (API REST — À implémenter)
─────────────────────            ───────────────────────────────────
src/api/axiosInstance.js  ──────►  BASE_URL: http://localhost:8000/api/v1
src/api/authApi.js        ──────►  /auth/*
src/api/signalementApi.js ──────►  /signalements/*
src/api/dashboardApi.js   ──────►  /dashboard/*
src/api/mapApi.js         ──────►  /map/*
src/api/aiApi.js          ──────►  /ai/*
```

---

## 2. Configuration de l'URL de Base

**Fichier:** `src/api/axiosInstance.js`

```javascript
// Remplacer cette ligne :
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
```

**Fichier `.env` à créer à la racine du projet :**
```env
VITE_API_URL=http://votre-serveur:8000/api/v1
```

---

## 3. Authentification JWT

### 3.1 Flux d'authentification
```
Client                          Serveur
  │── POST /auth/login ─────────►│
  │◄─ { token, user } ──────────│
  │── Stocke token localStorage  │
  │── GET /signalements          │
  │   Authorization: Bearer <token> ─►│
```

### 3.2 Endpoints Requis

#### `POST /auth/login`
**Corps de la requête:**
```json
{
  "email": "citoyen@exemple.com",
  "password": "MotDePasse123"
}
```
**Réponse attendue (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-123",
    "name": "Jean-Pierre Kabila",
    "email": "citoyen@exemple.com",
    "role": "citoyen",
    "commune": "Gombe",
    "phone": "+243810000000",
    "avatar": null,
    "stats": { "signalements": 12, "resolus": 8, "enCours": 3 }
  }
}
```

#### `POST /auth/register`
**Corps de la requête:**
```json
{
  "prenom": "Jean-Pierre",
  "nom": "Kabila",
  "email": "citoyen@exemple.com",
  "phone": "+243810000000",
  "commune": "Gombe",
  "role": "citoyen",
  "password": "MotDePasse123"
}
```
**Réponse attendue (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ...même structure que login }
}
```

#### `GET /auth/me`
**Headers:** `Authorization: Bearer <token>`
**Réponse:** Objet utilisateur (même structure que login)

#### `PUT /auth/profile`
**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
**Corps:** FormData avec les champs modifiés (name, email, phone, commune, avatar?)

---

## 4. Signalements

#### `GET /signalements`
**Query params optionnels:**
- `userId` — Filtrer par utilisateur (citoyen: ses propres signalements)
- `commune` — Filtrer par commune
- `statut` — Filtrer par statut (nouveau, en_traitement, resolu, rejete)
- `type` — Filtrer par type (inondation, depot_sauvage, erosion, brulage, pollution)

**Réponse (200):**
```json
[
  {
    "id": 1,
    "titre": "Inondation avenue Victoire",
    "type": "inondation",
    "statut": "en_traitement",
    "commune": "Gombe",
    "description": "...",
    "lat": -4.3225,
    "lng": 15.3222,
    "gravite": 3,
    "graviteLabel": "Élevé",
    "date": "2025-01-15T10:30:00Z",
    "photoUrl": null,
    "iaAnalyse": "Risque modéré d'inondation...",
    "signalePar": "uuid-123",
    "commentaires": []
  }
]
```

#### `GET /signalements/:id`
**Réponse:** Même structure qu'un élément de la liste + `commentaires` complets.

#### `POST /signalements`
**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
**Corps (FormData):**
```
titre       = "Inondation avenue Victoire"
type        = "inondation"
commune     = "Gombe"
description = "Description détaillée..."
lat         = -4.3225
lng         = 15.3222
gravite     = 3
photo       = [File] (optionnel)
```

#### `PUT /signalements/:id/statut`
**Headers:** `Authorization: Bearer <token>` (rôle autorite requis)
**Corps:**
```json
{ "statut": "en_traitement" }
```

#### `POST /signalements/:id/commentaires`
**Headers:** `Authorization: Bearer <token>`
**Corps:**
```json
{
  "texte": "Intervention programmée pour demain.",
  "auteur": "Nom de l'auteur"
}
```
**Réponse:**
```json
{
  "id": 1,
  "texte": "...",
  "auteur": "...",
  "date": "2025-01-16T14:00:00Z"
}
```

---

## 5. Dashboard

#### `GET /dashboard/citoyen/:userId`
**Réponse:**
```json
{
  "totalSignalements": 12,
  "resolus": 8,
  "enCours": 3,
  "pointsEco": 340,
  "rang": "Éco-Guerrier Bronze",
  "timeline": [
    { "id": 1, "titre": "...", "type": "inondation", "statut": "resolu", "date": "2025-01-15", "gravite": 3 }
  ]
}
```

#### `GET /dashboard/autorite`
**Headers:** `Authorization: Bearer <token>` (rôle autorite requis)
**Réponse:**
```json
{
  "totalSignalements": 487,
  "traites": 312,
  "urgences": 5,
  "tauxResolution": 64,
  "tempsMoyenTraitement": "36h",
  "urgencesActuelles": [
    { "id": 10, "titre": "Érosion critique", "commune": "Ngaba", "priorite": "CRITIQUE" }
  ],
  "performanceCommunes": [
    { "commune": "Gombe", "signalements": 87, "resolus": 72, "taux": 83 }
  ]
}
```

#### `GET /dashboard/stats/evolution`
**Réponse:**
```json
{
  "mensuel": [
    { "mois": "Fév", "signalements": 68, "resolus": 45, "dechets": 12.3 }
  ],
  "parType": [
    { "type": "Inondations", "count": 156, "pct": 32 }
  ],
  "zonesInondables": [
    { "commune": "Masina", "risque": 92 }
  ]
}
```

---

## 6. Carte SIG

#### `GET /map/incidents`
**Query params:** `commune`, `type`
**Réponse:**
```json
[
  {
    "id": 1, "titre": "...", "type": "inondation",
    "commune": "Gombe", "lat": -4.3225, "lng": 15.3222,
    "gravite": 3, "statut": "nouveau", "date": "2025-01-15"
  }
]
```

---

## 7. Analyse IA

#### `POST /ai/analyser`
**Corps:**
```json
{ "type": "inondation", "description": "L'eau monte rapidement..." }
```
**Réponse:**
```json
{
  "gravite": 4,
  "graviteLabel": "Critique",
  "confiance": 88,
  "analyse": "Inondation à risque élevé basé sur la localisation et la saison.",
  "recommandation": "Intervention rapide dans les 4 heures recommandée."
}
```

---

## 8. Structure des Rôles

| Rôle | Valeur API | Accès |
|------|-----------|-------|
| Éco-Citoyen | `citoyen` | Dashboard citoyen, créer signalements, commenter |
| Autorité Urbaine | `autorite` | Dashboard autorité, changer statuts, voir tous signalements |

---

## 9. Codes d'erreur HTTP Standardisés

| Code | Signification |
|------|--------------|
| 200 | Succès |
| 201 | Ressource créée |
| 400 | Données invalides (champ manquant, format incorrect) |
| 401 | Non authentifié (token manquant ou expiré) |
| 403 | Accès interdit (rôle insuffisant) |
| 404 | Ressource non trouvée |
| 422 | Validation échouée (détails dans `errors`) |
| 500 | Erreur serveur interne |

**Format d'erreur standard:**
```json
{
  "success": false,
  "message": "Email déjà utilisé.",
  "errors": { "email": ["L'adresse email est déjà enregistrée."] }
}
```

---

## 10. Checklist d'Activation du Backend Réel

- [ ] Créer le fichier `.env` avec `VITE_API_URL`
- [ ] Supprimer les imports `MOCK_*` dans chaque fichier `src/api/*.js`
- [ ] Remplacer les fonctions mock par les appels axios réels
- [ ] Configurer CORS sur le serveur pour accepter `http://localhost:5173`
- [ ] Implémenter l'authentification JWT avec durée de vie de 24h
- [ ] Configurer le stockage des photos (local ou S3/CDN)
- [ ] Tester chaque endpoint avec Postman avant connexion au frontend

---

*Document généré par EcoRDC Intelligence Frontend Team — Kinshasa, RDC*
