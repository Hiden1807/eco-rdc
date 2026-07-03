# Déploiement et Intégration du SIG (Système d'Information Géographique)

Ce document décrit comment le module cartographique du frontend EcoRDC interagit avec les données géospatiales et comment préparer le backend pour supporter ces fonctionnalités.

## 1. Technologies Frontend Utilisées
- **Leaflet.js** & **React-Leaflet** : Affichage interactif de la carte.
- **Leaflet-Draw** (Optionnel) : Pour tracer des polygones (ex: zones inondables).
- **Tuiles de base** : OpenStreetMap (par défaut) ou des fonds de carte satellitaires (ex: Mapbox).

## 2. Exigences Backend (Django)

Pour que la carte fonctionne pleinement avec le backend, vous aurez besoin de **GeoDjango** et **PostGIS**.

### A. Base de données
- Utilisez **PostgreSQL** avec l'extension **PostGIS**.
- Assurez-vous que vos modèles Django utilisent `django.contrib.gis.db.models`.

### B. Modèle `Signalement`
Le modèle des signalements doit inclure un champ `PointField` pour stocker les coordonnées exactes :

```python
from django.contrib.gis.db import models

class Signalement(models.Model):
    titre = models.CharField(max_length=200)
    type_incident = models.CharField(max_length=50)
    location = models.PointField(srid=4326) # Stocke Latitude / Longitude
    # ...
```

### C. API REST (Django REST Framework GIS)
Utilisez le package `djangorestframework-gis` pour sérialiser les données au format **GeoJSON**. Le frontend EcoRDC s'attend à recevoir des coordonnées sous ce format ou en `lat`/`lng` simples.

Exemple de réponse attendue par l'API :
```json
{
  "id": 1,
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [15.3208, -4.3285] // [Longitude, Latitude]
  },
  "properties": {
    "titre": "Inondation avenue Victoire",
    "gravite": 4
  }
}
```

## 3. Configuration Frontend
Si vous changez de fournisseur de tuiles (par exemple pour utiliser Mapbox pour des vues satellitaires), mettez à jour l'URL dans `src/pages/MapPage.jsx` :
```jsx
<TileLayer
  url="https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=VOTRE_TOKEN"
  attribution="&copy; Mapbox"
/>
```
