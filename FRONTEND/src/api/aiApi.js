// =============================================================
// src/api/aiApi.js — API de l'intelligence artificielle (simulation)
// Analyse automatique de la gravité et des recommandations
// ⚠️ LIAISON BACKEND : axiosInstance.post('ia/analyser/', { image, description, type, location })
// =============================================================
import axiosInstance from './axiosInstance'

const delay = (ms) => new Promise((res) => setTimeout(res, ms))

// Analyses prédéfinies par type d'incident (simule le retour de l'IA)
const IA_ANALYSES = {
  inondation: [
    'Zone de rétention d\'eau identifiée. Drainage insuffisant. Risque d\'aggravation si précipitations > 20mm. Pompage recommandé sous 4 heures.',
    'Inondation due à l\'obstruction des caniveaux. Curage immédiat des gouttières prioritaire.',
  ],
  depot_sauvage: [
    'Accumulation estimée par vision IA à 2-5 tonnes de déchets mixtes. 40% plastiques non recyclables. Collecte sous 72h recommandée.',
    'Dépôt chronique identifié (signatures temporelles multiples). Installation de panneaux dissuasifs conseillée après nettoyage.',
  ],
  erosion: [
    'Profil d\'érosion régressive détecté. Sol latéritique à forte perméabilité. Reboisement d\'urgence et gabions recommandés.',
    'Érosion hydrique active. Pente > 15%. Évacuation préventive des structures dans un rayon de 25m conseillée.',
  ],
  pollution: [
    'Contamination aux hydrocarbures probable. Indice de turbidité anormal. Prélèvements d\'échantillons d\'eau recommandés.',
    'Pollution chimique d\'origine industrielle suspectée. Fermeture de la zone de pêche recommandée en urgence.',
  ],
  brulage: [
    'Combustion de plastiques PVC détectée. Émissions de dioxines et furanes probables. Évacuation dans un rayon de 100m recommandée.',
    'Brûlage de déchets ménagers en zone résidentielle. Risque sanitaire élevé pour les populations vulnérables.',
  ],
  debris: [
    'Débris de construction inertes. Risque d\'accidents piétons élevé. Enlèvement sous 48h suffisant.',
    'Matériaux amiantés possibles. Analyse chimique avant manipulation recommandée.',
  ],
}

/**
 * analyserIncident — Analyse un incident et retourne un score de gravité + recommandations
 * 🔧 BACKEND: axiosInstance.post('ia/analyser/', formData)
 *    où formData contient: { image (fichier), type, description, lat, lng }
 * @param {Object} incidentData - Les données de l'incident à analyser
 * @returns {Promise<Object>} - { gravite: number, analyse: string, recommandations: string[] }
 */
export const analyserIncident = async (incidentData) => {
  await delay(2000) // Simule un temps de traitement IA plus long

  const { type, description } = incidentData

  // Choisit une analyse aléatoire pour le type donné
  const analyses = IA_ANALYSES[type] || IA_ANALYSES.depot_sauvage
  const analyseChoisie = analyses[Math.floor(Math.random() * analyses.length)]

  // Calcule un score de gravité basé sur des mots-clés dans la description
  let gravite = 2 // Modéré par défaut
  const descLower = (description || '').toLowerCase()
  if (descLower.includes('urgent') || descLower.includes('maison') || descLower.includes('menacé')) gravite = 4
  if (descLower.includes('enfant') || descLower.includes('école') || descLower.includes('évacuation')) gravite = 5
  if (descLower.includes('petit') || descLower.includes('faible') || descLower.includes('mineur')) gravite = 1
  if (type === 'erosion' || type === 'inondation') gravite = Math.max(gravite, 3)

  return {
    gravite,
    analyse: analyseChoisie,
    confiance: Math.floor(Math.random() * 15) + 82, // Score de confiance 82-97%
    recommandations: [
      'Photographier l\'étendue complète du sinistre',
      'Alerter les riverains proches si nécessaire',
      'Éviter tout contact direct avec les déchets ou eaux polluées',
    ],
    timestamp: new Date().toISOString(),
  }
}

/**
 * getConseilsEco — Retourne des conseils écologiques personnalisés
 * 🔧 BACKEND: axiosInstance.get('ia/conseils/', { params: { commune, saison } })
 * @param {string} commune - La commune de l'utilisateur
 * @returns {Promise<Array>} - Liste de conseils écologiques
 */
export const getConseilsEco = async (commune) => {
  await delay(400)
  return [
    { icon: 'bi-recycle', titre: 'Trier ses déchets', texte: `Dans la commune de ${commune || 'Kinshasa'}, déposez vos déchets plastiques dans les bacs verts et les déchets organiques dans les bacs marrons.` },
    { icon: 'bi-droplet', titre: 'Économiser l\'eau', texte: 'Récupérez l\'eau de pluie pour arroser vos plantes. Évitez de laisser couler l\'eau pendant le lavage.' },
    { icon: 'bi-tree', titre: 'Planter des arbres', texte: 'Un arbre planté aujourd\'hui protège votre quartier de l\'érosion demain. L\'OPE de Kinshasa distribue des plants gratuits.' },
    { icon: 'bi-sun', titre: 'Éviter le brûlage', texte: 'Le brûlage de plastiques génère des toxines dangereuses. Amenez vos déchets aux points de collecte officiels.' },
  ]
}
