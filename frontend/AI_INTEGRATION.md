# Intégration du Modèle d'Intelligence Artificielle (Eco-RDC)

Ce document décrit l'architecture recommandée pour l'intégration de la reconnaissance d'images par Intelligence Artificielle (IA) au sein de la plateforme **Eco-RDC Intelligence**.

## Objectif de l'IA
Analyser les photos soumises par les Éco-Citoyens lors de la création d'un signalement pour :
1. **Classifier automatiquement l'incident** (Inondation, Dépôt sauvage, Érosion, etc.).
2. **Estimer la gravité** de l'incident de 1 à 5.
3. **Détecter les fraudes** (images non pertinentes ou fausses).

---

## 1. Où placer le modèle IA ?

Le modèle IA **NE DOIT PAS** être inclus dans le projet Frontend (`/FRONTEND`). Les modèles de Deep Learning (comme YOLO, ResNet ou des LLM Vision) sont très lourds et nécessitent des environnements backend spécifiques (Python, PyTorch, TensorFlow).

### Architecture Recommandée
1. **Frontend (React)** : Se charge d'envoyer l'image via une requête HTTP POST au Backend.
2. **Backend (Node.js/Laravel/Python)** : Reçoit l'image, la valide, et l'envoie au microservice IA.
3. **Microservice IA (Python/FastAPI ou Flask)** : Héberge le modèle (ex: `model.pt` ou `model.h5`). Il prend l'image, fait l'inférence, et renvoie un JSON (classification + gravité).

> **Chemin suggéré pour l'infrastructure :**
> Créer un dossier séparé `AI_SERVICE` à la racine de votre projet global (à côté de `FRONTEND` et `BACKEND`). 
> Exemple: 
> - `/home/genius_24/Vidéos/FRONTEND/` (Ce projet)
> - `/home/genius_24/Vidéos/BACKEND/` (Serveur API Principal)
> - `/home/genius_24/Vidéos/AI_SERVICE/` (Microservice IA Python)

---

## 2. Structure du Microservice IA (Exemple)

Dans votre dossier `AI_SERVICE`, vous devriez avoir cette structure :

```text
AI_SERVICE/
├── main.py                # Point d'entrée FastAPI (API REST)
├── requirements.txt       # Dépendances (fastapi, torch, torchvision, pillow)
├── models/
│   └── ecordc_v1.pt       # LE FICHIER DU MODÈLE IA (PyTorch)
└── utils/
    └── image_processor.py # Script pour redimensionner/normaliser l'image avant prédiction
```

---

## 3. Communication Frontend -> IA

Dans le projet actuel (`FRONTEND`), lorsque l'utilisateur soumet un signalement (`NewSignalement.jsx`), l'application appelle l'API principale.

**Flux de données :**
1. L'utilisateur uploade une photo dans React.
2. React l'envoie via Axios à l'API principale (ex: `POST /api/signalements`).
3. L'API principale transmet la photo à l'API IA (ex: `POST http://localhost:8000/predict`).
4. L'API IA renvoie :
   ```json
   {
     "type_incident": "depot_sauvage",
     "confidence": 0.94,
     "gravite_estimee": 3
   }
   ```
5. L'API principale enregistre le signalement avec ces données et notifie le Frontend.

> [!TIP]
> Ne jamais appeler l'API IA directement depuis le Frontend pour des raisons de sécurité (Cross-Origin, exposition de l'IP du serveur IA, limitation de requêtes). Toujours passer par votre Backend principal !
