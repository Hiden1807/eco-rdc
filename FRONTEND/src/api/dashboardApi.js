// =============================================================
// src/api/dashboardApi.js — API du tableau de bord (mock data Kinshasa)
// ⚠️ LIAISON BACKEND : Remplacer par axiosInstance.get('dashboard/stats/')
// =============================================================
import axiosInstance from './axiosInstance'

const delay = (ms) => new Promise((res) => setTimeout(res, ms))

/**
 * getStatsCitoyen — Statistiques personnelles du citoyen connecté
 * 🔧 BACKEND: axiosInstance.get('dashboard/citoyen/stats/')
 */
export const getStatsCitoyen = async (userId) => {
  await delay(600)
  return {
    totalSignalements: 12,
    resolus: 8,
    enCours: 3,
    rejetes: 1,
    pointsEco: 340, // Gamification
    rang: 'Éco-Citoyen Bronze',
    communeActive: 'Gombe',
    // Timeline des signalements récents
    timeline: [
      { id: 1, titre: 'Inondation avenue Victoire', type: 'inondation', statut: 'en_traitement', date: '2024-01-15', gravite: 4 },
      { id: 2, titre: 'Dépôt sauvage N\'Djili marché', type: 'depot_sauvage', statut: 'nouveau', date: '2024-01-14', gravite: 2 },
      { id: 3, titre: 'Érosion ravine Ngaliema', type: 'erosion', statut: 'resolu', date: '2024-01-10', gravite: 5 },
      { id: 4, titre: 'Brûlage déchets Lemba', type: 'brulage', statut: 'nouveau', date: '2024-01-16', gravite: 3 },
    ],
  }
}

/**
 * getStatsAutorite — Statistiques de performance pour les autorités
 * 🔧 BACKEND: axiosInstance.get('dashboard/autorite/stats/')
 */
export const getStatsAutorite = async () => {
  await delay(700)
  return {
    totalSignalements: 487,
    traites: 312,
    urgences: 5,
    tauxResolution: 64,
    tempsMoyenTraitement: '18h', // Temps moyen de résolution
    // Performance par commune
    performanceCommunes: [
      { commune: 'Gombe', signalements: 87, resolus: 72, taux: 83 },
      { commune: 'Ngaliema', signalements: 65, resolus: 41, taux: 63 },
      { commune: 'Ndjili', signalements: 54, resolus: 28, taux: 52 },
      { commune: 'Limete', signalements: 43, resolus: 35, taux: 81 },
      { commune: 'Masina', signalements: 38, resolus: 18, taux: 47 },
      { commune: 'Kimbanseke', signalements: 33, resolus: 22, taux: 67 },
      { commune: 'Lemba', signalements: 29, resolus: 19, taux: 66 },
      { commune: 'Bumbu', signalements: 24, resolus: 12, taux: 50 },
    ],
    // Urgences en cours à Kinshasa
    urgencesActuelles: [
      { id: 1, titre: 'Inondation avenue Victoire - Gombe', type: 'inondation', gravite: 4, commune: 'Gombe', priorite: 'HAUTE' },
      { id: 5, titre: 'Pollution rivière N\'Djili', type: 'pollution', gravite: 4, commune: 'Masina', priorite: 'HAUTE' },
      { id: 4, titre: 'Brûlage Lemba - École Saint-Joseph', type: 'brulage', gravite: 3, commune: 'Lemba', priorite: 'MOYENNE' },
      { id: 7, titre: 'Érosion Ngaba - Quartier Mbenseke', type: 'erosion', gravite: 5, commune: 'Ngaba', priorite: 'CRITIQUE' },
      { id: 8, titre: 'Dépôt géant - Avenue Kasa-Vubu', type: 'depot_sauvage', gravite: 3, commune: 'Kasa-Vubu', priorite: 'MOYENNE' },
    ],
  }
}

/**
 * getEvolutionStats — Données d'évolution pour les graphiques
 * 🔧 BACKEND: axiosInstance.get('statistiques/evolution/')
 */
export const getEvolutionStats = async () => {
  await delay(800)
  return {
    // Évolution mensuelle des signalements (6 derniers mois)
    mensuel: [
      { mois: 'Août', signalements: 42, resolus: 28, dechets: 12.5 },
      { mois: 'Sep.', signalements: 58, resolus: 39, dechets: 18.2 },
      { mois: 'Oct.', signalements: 71, resolus: 45, dechets: 22.1 },
      { mois: 'Nov.', signalements: 65, resolus: 51, dechets: 19.8 },
      { mois: 'Déc.', signalements: 49, resolus: 38, dechets: 14.3 },
      { mois: 'Jan.', signalements: 87, resolus: 61, dechets: 28.7 },
    ],
    // Répartition par type d'incident
    parType: [
      { type: 'Dépôt Sauvage', count: 198, pct: 41 },
      { type: 'Inondation', count: 142, pct: 29 },
      { type: 'Érosion', count: 87, pct: 18 },
      { type: 'Pollution', count: 38, pct: 8 },
      { type: 'Brûlage', count: 22, pct: 4 },
    ],
    // Zones inondables à Kinshasa (indice de risque 0-100)
    zonesInondables: [
      { commune: 'Masina', risque: 92 }, { commune: 'Ndjili', risque: 87 },
      { commune: 'Kimbanseke', risque: 81 }, { commune: 'Nsele', risque: 78 },
      { commune: 'Bumbu', risque: 65 }, { commune: 'Ngaba', risque: 58 },
      { commune: 'Lemba', risque: 42 }, { commune: 'Gombe', risque: 35 },
    ],
  }
}
