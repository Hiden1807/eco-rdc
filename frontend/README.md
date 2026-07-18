# EcoRDC Intelligence - Frontend

EcoRDC est une plateforme d'intelligence citoyenne et environnementale dédiée à la ville de Kinshasa. Elle permet de signaler, analyser et cartographier les incidents écologiques (érosions, inondations, dépôts sauvages, etc.).

## 🚀 Fonctionnalités Principales

1. **Tableaux de Bord Dynamiques**
   - Espace Citoyen : Suivi des signalements, progression gamifiée (Éco-Points).
   - Espace Autorité (Centre de Contrôle) : Vue globale, statistiques avancées et gestion des états d'incidents.
2. **Analyse par Intelligence Artificielle**
   - Reconnaissance d'images d'incidents environnementaux.
   - Évaluation automatique de la gravité, diagnostics visuels et recommandations d'urgence.
3. **Cartographie SIG**
   - Visualisation de tous les incidents géolocalisés de Kinshasa sur une carte interactive (Leaflet).
   - Filtres par type de sinistre.
4. **Section Éducation**
   - Guides interactifs et téléchargeables en PDF pour sensibiliser la population aux gestes verts.
   - Quiz d'évaluation de connaissances.
5. **Thème Premium**
   - Bascule instantanée entre le Mode Clair et le Mode Sombre.
   - Design Glassmorphism (effets de flou), animations fluides, interface adaptative (Mobile-first).

## 🛠 Exigences Techniques

- **Node.js** (v16.0 ou supérieur)
- **NPM** ou **Yarn**

### Bibliothèques et Frameworks
- **React.js** (v18) via Vite.js
- **React Router Dom** (v6) pour la navigation.
- **Bootstrap 5** (utilisé uniquement pour le système de grille et certains utilitaires, le design principal étant customisé).
- **Bootstrap Icons** pour l'iconographie.
- **React-Leaflet** & **Leaflet** pour la cartographie.

## 💻 Comment Lancer le Projet

1. **Installer les dépendances**
   ```bash
   npm install
   # ou
   yarn install
   ```

2. **Démarrer le serveur de développement**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

3. **Accéder à l'application**
   Ouvrez votre navigateur à l'adresse indiquée dans le terminal (généralement `http://localhost:5173`).

## 📁 Structure du Projet

- `/src/api` : Fichiers centralisant les requêtes (Mockées actuellement, prêtes pour Django).
- `/src/components` : Composants réutilisables (Navbar, Sidebar, Loader).
- `/src/context` : Gestionnaires d'état globaux (Thème, Authentification).
- `/src/layouts` : Structures de base des pages (Public vs Protégé).
- `/src/pages` : Toutes les vues principales de l'application (Home, Dashboard, Map, AIAnalysis...).
- `/src/routes` : Configuration du routage avec protection par Rôle (Citoyen vs Autorité).
- `index.css` : Feuille de style globale contenant toutes les variables CSS pour le mode Clair/Sombre et les styles Glassmorphism.

## 🔗 Documentation Associée
- Lisez `BACKEND_CONNECTION.md` pour savoir comment brancher ce frontend à votre serveur Django.
- Lisez `SIG_SETUP.md` pour configurer correctement la cartographie et les données géospatiales côté serveur.
