# Connexion au Backend (Django)

Ce document explique comment lier l'interface frontend React à votre backend Django REST Framework.

## 1. Fichier d'Instance Axios
Toute la communication avec le backend centralise via le fichier `src/api/axiosInstance.js`.

**Action Requise :**
Lorsque votre backend est prêt, mettez à jour l'URL de base dans ce fichier :
```javascript
const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/', // À remplacer par votre URL de production plus tard
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})
```

## 2. Suppression des Mocks
Pour l'instant, les fichiers dans le dossier `src/api/` (ex: `signalementApi.js`, `dashboardApi.js`, `aiApi.js`) utilisent des données simulées (Mocks) pour les tests.

**Comment passer en production :**
Chaque fonction de ces fichiers est documentée avec un commentaire `// 🔧 BACKEND-INTEGRATION:`.
Supprimez les listes codées en dur (comme `MOCK_SIGNALEMENTS`) et le `delay()` simulé. Remplacez le corps de la fonction par un véritable appel.

*Exemple de transition :*

**Avant (Mock) :**
```javascript
export const getSignalements = async () => {
  await delay(600);
  return [...MOCK_SIGNALEMENTS];
}
```

**Après (Intégration) :**
```javascript
export const getSignalements = async (filters) => {
  const response = await axiosInstance.get('signalements/', { params: filters });
  return response.data;
}
```

## 3. Authentification et JWT
L'application frontend gère les tokens JWT (JSON Web Tokens) de manière autonome.
Dans `src/api/axiosInstance.js`, un intercepteur Axios est déjà configuré pour attacher automatiquement `Bearer <token>` à chaque requête si l'utilisateur est connecté.

Assurez-vous que votre backend Django inclut les packages `djangorestframework-simplejwt` (ou `djoser`) et renvoie bien `{ access, refresh }` lors du login.

## 4. Configuration CORS (Cross-Origin Resource Sharing)
Pour que React (souvent sur `localhost:5173`) puisse parler à Django (`localhost:8000`), le backend doit autoriser le domaine.
Dans `settings.py` de Django :
```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
]
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ...
]
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```
