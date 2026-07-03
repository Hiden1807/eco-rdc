// =============================================================
// src/api/signalementApi.js — API des signalements écologiques (mock)
// ⚠️ LIAISON BACKEND : Remplacer les données mock par des appels DRF réels
// =============================================================
import axiosInstance from './axiosInstance'

const delay = (ms) => new Promise((res) => setTimeout(res, ms))

// Communes de Kinshasa pour la démo
export const COMMUNES_KINSHASA = [
  'Gombe', 'Limete', 'Ngaliema', 'Bandalungwa', 'Barumbu', 'Bumbu',
  'Kalamu', 'Kasa-Vubu', 'Kimbanseke', 'Kinshasa', 'Kintambo',
  'Kisenso', 'Lemba', 'Lingwala', 'Makala', 'Maluku', 'Masina',
  'Matete', 'Mont-Ngafula', 'Ndjili', 'Ngaba', 'Ngiri-Ngiri',
  'Nsele', 'Selembao',
]

// Types d'incidents écologiques à Kinshasa
export const TYPES_INCIDENT = [
  { value: 'inondation', label: 'Inondation', icon: 'bi-water', color: '#2980b9' },
  { value: 'depot_sauvage', label: 'Dépôt Sauvage', icon: 'bi-trash3', color: '#e67e22' },
  { value: 'erosion', label: 'Érosion de Terrain', icon: 'bi-exclamation-triangle', color: '#c0392b' },
  { value: 'pollution', label: 'Pollution des Eaux', icon: 'bi-droplet-half', color: '#8e44ad' },
  { value: 'brulage', label: 'Brûlage Déchets', icon: 'bi-fire', color: '#e74c3c' },
  { value: 'debris', label: 'Débris de Construction', icon: 'bi-bricks', color: '#7f8c8d' },
]

// Niveaux de gravité calculés par l'IA
export const GRAVITE_IA = [
  { level: 1, label: 'Faible', color: '#27ae60', badge: 'success' },
  { level: 2, label: 'Modéré', color: '#f39c12', badge: 'warning' },
  { level: 3, label: 'Élevé', color: '#e67e22', badge: 'orange' },
  { level: 4, label: 'Critique', color: '#c0392b', badge: 'danger' },
  { level: 5, label: 'Urgence', color: '#922b21', badge: 'dark' },
]

// Données mock de signalements de Kinshasa
const MOCK_SIGNALEMENTS = [
  {
    id: 1, titre: 'Inondation avenue Victoire', type: 'inondation', commune: 'Gombe',
    description: 'L\'avenue Victoire est complètement inondée à hauteur du rond-point Victoire. Les eaux montent suite aux fortes pluies nocturnes. Plusieurs maisons sont touchées et la circulation est bloquée.',
    statut: 'en_traitement', gravite: 4, graviteLabel: 'Critique', signalePar: 1,
    lat: -4.3285, lng: 15.3208, date: '2024-01-15T08:30:00', photo: null,
    commentaires: [
      { auteur: 'Inspecteur Mwamba', date: '2024-01-15T10:00:00', texte: 'Équipe déployée sur place. Pompage en cours.' },
      { auteur: 'Service Hydrologie', date: '2024-01-15T11:30:00', texte: 'Niveau d\'eau en baisse. Fin estimée à 14h00.' },
    ],
    iaAnalyse: 'Risque d\'inondation critique. Zone à faible drainage. Intervention urgente recommandée sous 2 heures.',
  },
  {
    id: 2, titre: 'Dépôt sauvage N\'Djili marché', type: 'depot_sauvage', commune: 'Ndjili',
    description: 'Accumulation massive de déchets ménagers et plastiques derrière le marché central de N\'Djili. L\'odeur est insupportable et attire des vecteurs de maladies.',
    statut: 'nouveau', gravite: 2, graviteLabel: 'Modéré', signalePar: 1,
    lat: -4.3895, lng: 15.4231, date: '2024-01-14T14:20:00', photo: null,
    commentaires: [],
    iaAnalyse: 'Accumulation estimée à 3-4 tonnes. Risque sanitaire modéré. Collecte à planifier dans les 48h.',
  },
  {
    id: 3, titre: 'Érosion ravine Ngaliema', type: 'erosion', commune: 'Ngaliema',
    description: 'Une ravine de 15 mètres de profondeur s\'est formée sur le flanc de la colline. Plusieurs maisons environnantes sont menacées d\'effondrement. Situation alarmante.',
    statut: 'resolu', gravite: 5, graviteLabel: 'Urgence', signalePar: 1,
    lat: -4.2890, lng: 15.2456, date: '2024-01-10T07:15:00', photo: null,
    commentaires: [
      { auteur: 'Génie Civil Kinshasa', date: '2024-01-10T09:00:00', texte: 'Zones évacuées. Gabions installés.' },
      { auteur: 'Inspecteur Mwamba', date: '2024-01-12T16:00:00', texte: 'Travaux de consolidation terminés. Ravine stabilisée.' },
    ],
    iaAnalyse: 'Urgence absolue. Sol argileux très instable. Évacuation immédiate des habitants recommandée.',
  },
  {
    id: 4, titre: 'Brûlage déchets plastiques Lemba', type: 'brulage', commune: 'Lemba',
    description: 'Brûlage à ciel ouvert de déchets plastiques à proximité de l\'école primaire Saint-Joseph. Fumée noire et toxique observée depuis plusieurs heures.',
    statut: 'nouveau', gravite: 3, graviteLabel: 'Élevé', signalePar: 1,
    lat: -4.3612, lng: 15.3789, date: '2024-01-16T09:45:00', photo: null,
    commentaires: [],
    iaAnalyse: 'Émissions de dioxines détectées. Risque élevé pour la santé des enfants. Intervention sous 1 heure conseillée.',
  },
  {
    id: 5, titre: 'Pollution rivière N\'Djili', type: 'pollution', commune: 'Masina',
    description: 'Déversement d\'huile de vidange dans la rivière N\'Djili near le pont de Masina. Nappe huileuse visible sur 200 mètres. Poissons morts en surface.',
    statut: 'en_traitement', gravite: 4, graviteLabel: 'Critique', signalePar: 1,
    lat: -4.4123, lng: 15.5012, date: '2024-01-13T11:00:00', photo: null,
    commentaires: [
      { auteur: 'Environnement Mairie', date: '2024-01-13T13:00:00', texte: 'Echantillons prélevés. Analyse en cours.' },
    ],
    iaAnalyse: 'Contamination aux hydrocarbures confirmée. Zone de pêche à fermer immédiatement.',
  },
  {
    id: 6, titre: 'Dépôt clandestins Kimbanseke', type: 'depot_sauvage', commune: 'Kimbanseke',
    description: 'Site de dépôt sauvage de débris de construction envahissant la voie publique de l\'avenue Luambo Makiadi sur plus de 100 mètres.',
    statut: 'resolu', gravite: 1, graviteLabel: 'Faible', signalePar: 1,
    lat: -4.4456, lng: 15.4112, date: '2024-01-08T15:30:00', photo: null,
    commentaires: [
      { auteur: 'OPE Kimbanseke', date: '2024-01-09T08:00:00', texte: 'Camion de collecte dépêché. Nettoyage effectué.' },
    ],
    iaAnalyse: 'Déchets inertes de construction. Risque faible. Collecte standard suffisante.',
  },
]

/**
 * getSignalements — Récupère la liste des signalements (filtrés ou non)
 * 🔧 BACKEND: Remplacer par axiosInstance.get('signalements/', { params: filters })
 * @param {Object} filters - Filtres optionnels (commune, type, statut)
 * @returns {Promise<Array>} - Liste des signalements
 */
export const getSignalements = async (filters = {}) => {
  await delay(600)
  let data = [...MOCK_SIGNALEMENTS]
  // Filtre par commune si spécifié
  if (filters.commune) data = data.filter((s) => s.commune === filters.commune)
  // Filtre par type si spécifié
  if (filters.type) data = data.filter((s) => s.type === filters.type)
  // Filtre par statut si spécifié
  if (filters.statut) data = data.filter((s) => s.statut === filters.statut)
  // Filtre par utilisateur (pour "mes signalements")
  if (filters.userId) data = data.filter((s) => s.signalePar === filters.userId)
  return data
}

/**
 * getSignalementById — Récupère un signalement par son identifiant
 * 🔧 BACKEND: Remplacer par axiosInstance.get(`signalements/${id}/`)
 * @param {number} id - L'identifiant du signalement
 * @returns {Promise<Object>} - Le signalement correspondant
 */
export const getSignalementById = async (id) => {
  await delay(400)
  const found = MOCK_SIGNALEMENTS.find((s) => s.id === parseInt(id))
  if (!found) throw new Error('Signalement non trouvé')
  return found
}

/**
 * createSignalement — Crée un nouveau signalement écologique
 * 🔧 BACKEND: Remplacer par axiosInstance.post('signalements/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
 * Note: Utiliser FormData pour inclure la photo de l'incident
 * @param {Object} data - Les données du nouveau signalement
 * @returns {Promise<Object>} - Le signalement créé avec son ID
 */
export const createSignalement = async (data) => {
  await delay(1200)
  const newSignalement = {
    id: Date.now(),
    ...data,
    statut: 'nouveau',
    date: new Date().toISOString(),
    commentaires: [],
    graviteLabel: GRAVITE_IA.find((g) => g.level === data.gravite)?.label || 'Modéré',
    iaAnalyse: 'Analyse IA en cours de traitement. Résultat disponible dans 2-3 minutes.',
  }
  MOCK_SIGNALEMENTS.push(newSignalement)
  return newSignalement
}

/**
 * addCommentaire — Ajoute un commentaire à un signalement
 * 🔧 BACKEND: Remplacer par axiosInstance.post(`signalements/${id}/commentaires/`, { texte })
 * @param {number} signalementId - L'ID du signalement
 * @param {string} texte - Le texte du commentaire
 * @returns {Promise<Object>} - Le commentaire créé
 */
export const addCommentaire = async (signalementId, texte, auteur) => {
  await delay(500)
  const newComment = {
    auteur: auteur || 'Utilisateur',
    date: new Date().toISOString(),
    texte,
  }
  const signalement = MOCK_SIGNALEMENTS.find((s) => s.id === signalementId)
  if (signalement) signalement.commentaires.push(newComment)
  return newComment
}

/**
 * updateStatut — Met à jour le statut d'un signalement (réservé aux autorités)
 * 🔧 BACKEND: Remplacer par axiosInstance.patch(`signalements/${id}/`, { statut })
 * @param {number} id - L'ID du signalement
 * @param {string} statut - Le nouveau statut
 * @returns {Promise<Object>} - Le signalement mis à jour
 */
export const updateStatut = async (id, statut) => {
  await delay(500)
  const signalement = MOCK_SIGNALEMENTS.find((s) => s.id === id)
  if (signalement) signalement.statut = statut
  return signalement
}
