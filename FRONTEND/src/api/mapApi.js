// =============================================================
// src/api/mapApi.js — API des données cartographiques SIG (mock)
// Points géographiques réels des communes de Kinshasa
// ⚠️ LIAISON BACKEND : axiosInstance.get('map/incidents/')
// =============================================================
import axiosInstance from './axiosInstance'

const delay = (ms) => new Promise((res) => setTimeout(res, ms))

// Centre géographique de Kinshasa
export const KINSHASA_CENTER = { lat: -4.3225, lng: 15.3222 }

// Coordonnées centrales des communes de Kinshasa (données GPS réelles)
export const COMMUNES_COORDS = {
  'Gombe':       { lat: -4.3036, lng: 15.3116, couleur: '#2980b9' },
  'Limete':      { lat: -4.3326, lng: 15.3694, couleur: '#27ae60' },
  'Ngaliema':    { lat: -4.3115, lng: 15.2465, couleur: '#8e44ad' },
  'Bandalungwa': { lat: -4.3456, lng: 15.2978, couleur: '#e67e22' },
  'Barumbu':     { lat: -4.3175, lng: 15.3231, couleur: '#c0392b' },
  'Bumbu':       { lat: -4.3876, lng: 15.2934, couleur: '#16a085' },
  'Kalamu':      { lat: -4.3556, lng: 15.3312, couleur: '#d35400' },
  'Kasa-Vubu':   { lat: -4.3385, lng: 15.3023, couleur: '#2c3e50' },
  'Kimbanseke':  { lat: -4.4456, lng: 15.4112, couleur: '#7f8c8d' },
  'Kinshasa':    { lat: -4.3225, lng: 15.3222, couleur: '#2d7a4e' },
  'Lemba':       { lat: -4.3612, lng: 15.3789, couleur: '#f39c12' },
  'Lingwala':    { lat: -4.3123, lng: 15.3067, couleur: '#1abc9c' },
  'Masina':      { lat: -4.4123, lng: 15.5012, couleur: '#e74c3c' },
  'Matete':      { lat: -4.3945, lng: 15.3623, couleur: '#9b59b6' },
  'Ndjili':      { lat: -4.3895, lng: 15.4231, couleur: '#3498db' },
  'Ngaba':       { lat: -4.3712, lng: 15.3156, couleur: '#1abc9c' },
  'Ngiri-Ngiri': { lat: -4.3467, lng: 15.3189, couleur: '#e67e22' },
}

/**
 * getMapIncidents — Récupère tous les incidents géolocalisés pour la carte
 * 🔧 BACKEND: axiosInstance.get('map/incidents/', { params: filters })
 * @param {Object} filters - Filtres optionnels (commune, type)
 * @returns {Promise<Array>} - Incidents avec coordonnées GPS
 */
export const getMapIncidents = async (filters = {}) => {
  await delay(700)

  // Données d'incidents géolocalisés sur la carte de Kinshasa
  let incidents = [
    { id: 1, titre: 'Inondation avenue Victoire', type: 'inondation', commune: 'Gombe',
      lat: -4.3285, lng: 15.3208, gravite: 4, statut: 'en_traitement', date: '2024-01-15' },
    { id: 2, titre: 'Dépôt N\'Djili Marché', type: 'depot_sauvage', commune: 'Ndjili',
      lat: -4.3895, lng: 15.4231, gravite: 2, statut: 'nouveau', date: '2024-01-14' },
    { id: 3, titre: 'Érosion ravine Ngaliema', type: 'erosion', commune: 'Ngaliema',
      lat: -4.2890, lng: 15.2456, gravite: 5, statut: 'resolu', date: '2024-01-10' },
    { id: 4, titre: 'Brûlage déchets Lemba', type: 'brulage', commune: 'Lemba',
      lat: -4.3612, lng: 15.3789, gravite: 3, statut: 'nouveau', date: '2024-01-16' },
    { id: 5, titre: 'Pollution rivière N\'Djili', type: 'pollution', commune: 'Masina',
      lat: -4.4123, lng: 15.5012, gravite: 4, statut: 'en_traitement', date: '2024-01-13' },
    { id: 6, titre: 'Dépôt Kimbanseke', type: 'depot_sauvage', commune: 'Kimbanseke',
      lat: -4.4456, lng: 15.4112, gravite: 1, statut: 'resolu', date: '2024-01-08' },
    { id: 7, titre: 'Érosion Ngaba', type: 'erosion', commune: 'Ngaba',
      lat: -4.3712, lng: 15.3156, gravite: 5, statut: 'nouveau', date: '2024-01-16' },
    { id: 8, titre: 'Dépôt Avenue Kasa-Vubu', type: 'depot_sauvage', commune: 'Kasa-Vubu',
      lat: -4.3385, lng: 15.3023, gravite: 3, statut: 'nouveau', date: '2024-01-15' },
    { id: 9, titre: 'Inondation Matete Bas', type: 'inondation', commune: 'Matete',
      lat: -4.3945, lng: 15.3623, gravite: 3, statut: 'en_traitement', date: '2024-01-12' },
    { id: 10, titre: 'Déchets Lingwala Marché', type: 'depot_sauvage', commune: 'Lingwala',
      lat: -4.3123, lng: 15.3067, gravite: 2, statut: 'nouveau', date: '2024-01-11' },
    { id: 11, titre: 'Érosion Bumbu colline', type: 'erosion', commune: 'Bumbu',
      lat: -4.3876, lng: 15.2934, gravite: 4, statut: 'en_traitement', date: '2024-01-09' },
    { id: 12, titre: 'Inondation Kalamu bas', type: 'inondation', commune: 'Kalamu',
      lat: -4.3556, lng: 15.3312, gravite: 2, statut: 'resolu', date: '2024-01-07' },
  ]

  // Applique les filtres si nécessaire
  if (filters.commune) incidents = incidents.filter((i) => i.commune === filters.commune)
  if (filters.type)    incidents = incidents.filter((i) => i.type === filters.type)
  if (filters.statut)  incidents = incidents.filter((i) => i.statut === filters.statut)

  return incidents
}
