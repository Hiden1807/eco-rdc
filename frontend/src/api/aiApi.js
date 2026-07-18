import axiosInstance from './axiosInstance'

// Transforme la reponse brute du backend IA en format directement exploitable
// par les pages React, tout en conservant `raw` pour les usages avances.
function normalizeGravity(value) {
  const normalized = String(value || 'moyen')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
  if (['faible', 'low'].includes(normalized)) return 1
  if (['moyen', 'moyenne', 'modere', 'moderee', 'medium'].includes(normalized)) return 2
  if (['eleve', 'elevee', 'haute', 'high'].includes(normalized)) return 3
  if (['critique', 'critical', 'urgence'].includes(normalized)) return 4
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 2
}

function normalizeConfidence(value) {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric)) return 0
  return Math.round(numeric > 0 && numeric <= 1 ? numeric * 100 : numeric)
}

function toFrontendAnalysis(payload = {}) {
  if (payload.success === false) {
    const error = new Error(payload.error_code || 'provider_unavailable')
    error.response = { data: payload }
    throw error
  }
  const analysis = payload.analysis || payload
  const level = normalizeGravity(analysis.gravite || analysis.gravity || 'moyen')
  return {
    gravite: level,
    graviteLabel: { 1: 'Faible', 2: 'Modere', 3: 'Eleve', 4: 'Critique', 5: 'Urgence' }[level] || 'Modere',
    confiance: normalizeConfidence(analysis.score_confiance || analysis.confidence_score || analysis.confiance || 0),
    analyse: analysis.resume_court || analysis.resume || analysis.summary || '',
    recommandations: [
      analysis.recommandation_autorite,
      analysis.recommandation_citoyen,
      analysis.recommandation || analysis.recommendation,
      ...(analysis.actions_preventives || []),
      ...(analysis.conseils_publics || []),
    ].filter(Boolean),
    providerSource: analysis._provider || payload.provider?.active || '',
    model: analysis._model || '',
    visualAnalysisReady: ['gemini_vision', 'openrouter_vision'].includes(analysis._provider),
    raw: analysis,
  }
}

export const analyserIncident = async (incidentData) => {
  const payload = {
    title: incidentData.titre || incidentData.title || incidentData.type || 'Signalement',
    description: incidentData.description || 'Analyse image demandee',
    type: incidentData.type,
    commune: incidentData.commune,
    lat: incidentData.lat,
    lng: incidentData.lng,
  }

  // Quand une image est disponible, l'API recoit un vrai multipart. Le backend
  // peut alors utiliser Gemini des que la cle est renseignee dans l'environnement.
  if (incidentData.imageFile) {
    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') formData.append(key, value)
    })
    formData.append('image', incidentData.imageFile)
    // Ne pas forcer Content-Type: le boundary multipart est ajoute par le navigateur.
    const response = await axiosInstance.post('ai/signalement-triage/', formData)
    return toFrontendAnalysis(response.data)
  }

  const response = await axiosInstance.post('ai/signalement-triage/', payload)
  return toFrontendAnalysis(response.data)
}

export const analyzeSignalement = analyserIncident

export const getConseilsEco = async () => {
  const response = await axiosInstance.get('ai/predictive-briefing/')
  return (response.data.preventive_actions || []).map((item) => ({
    icon: 'bi-lightbulb',
    titre: item.title,
    texte: `${item.commune}: ${item.reason} Delai: ${item.deadline}.`,
  }))
}

export const askAssistant = async (input) => {
  const payload =
    typeof input === 'string'
      ? { question: input }
      : {
          question: input?.question || '',
          conversation_id: input?.conversationId || null,
          page_context: input?.pageContext || '',
        }
  const response = await axiosInstance.post('ai/assistant/', payload)
  if (response.data?.success === false) {
    const error = new Error(response.data.error_code || 'provider_unavailable')
    error.response = { data: response.data }
    throw error
  }
  return response.data
}

export const getPredictiveBriefing = async (days = 7) => {
  const response = await axiosInstance.get('ai/predictive-briefing/', { params: { days } })
  return response.data
}

export const predictRisk = async (params = {}) => {
  const response = await axiosInstance.get('ai/predict-risk/', { params })
  return response.data
}

export const generateEducationContent = async (payload = {}) => {
  const response = await axiosInstance.post('ai/generate-education-content/', payload)
  return response.data
}
