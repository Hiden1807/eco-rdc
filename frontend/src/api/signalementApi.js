import axiosInstance from './axiosInstance'
import {
  GRAVITY_LEVEL_TO_BACK,
  STATUT_FRONT_TO_BACK,
  normalizeCategory,
  normalizeComment,
  normalizeCommune,
  normalizeSignalement,
  unwrapList,
} from './normalizers'

export const GRAVITE_IA = [
  { level: 1, label: 'Faible', color: '#27ae60', badge: 'success' },
  { level: 2, label: 'Modere', color: '#f39c12', badge: 'warning' },
  { level: 3, label: 'Eleve', color: '#e67e22', badge: 'orange' },
  { level: 4, label: 'Critique', color: '#c0392b', badge: 'danger' },
  { level: 5, label: 'Urgence', color: '#922b21', badge: 'dark' },
]

export const getCommunes = async () => {
  const response = await axiosInstance.get('locations/communes/')
  return unwrapList(response.data).map(normalizeCommune)
}

export const getTypesIncident = async () => {
  const response = await axiosInstance.get('signalements/categories/')
  return unwrapList(response.data).map(normalizeCategory)
}

export const getSignalements = async (filters = {}) => {
  const params = {}
  if (filters.statut) params.status = STATUT_FRONT_TO_BACK[filters.statut] || filters.statut
  if (filters.communeId) params.commune = filters.communeId
  if (filters.typeId) params.category = filters.typeId
  const response = await axiosInstance.get('signalements/signalements/', { params })
  return unwrapList(response.data).map(normalizeSignalement)
}

export const getSignalementById = async (id) => {
  const response = await axiosInstance.get(`signalements/signalements/${id}/`)
  return normalizeSignalement(response.data)
}

export const createSignalement = async (data) => {
  const formData = new FormData()
  formData.append('title', data.titre || data.title)
  formData.append('description', data.description)
  formData.append('position_source', data.lat && data.lng ? 'browser' : 'manual')
  if (data.categoryId || data.category) formData.append('category', data.categoryId || data.category)
  if (data.communeId || data.commune) formData.append('commune', data.communeId || data.commune)
  if (data.provinceId) formData.append('province', data.provinceId)
  if (data.addressText || data.adresseExacte) formData.append('address_text', data.addressText || data.adresseExacte)
  if (data.lat) formData.append('latitude', data.lat)
  if (data.lng) formData.append('longitude', data.lng)
  if (data.photoFile) formData.append('photo', data.photoFile)
  else if (data.photo instanceof File) formData.append('photo', data.photo)

  // Le navigateur doit ajouter lui-meme le boundary multipart; le forcer ici
  // peut empecher Django de lire correctement la photo.
  const response = await axiosInstance.post('signalements/signalements/', formData)
  return normalizeSignalement(response.data)
}

export const addCommentaire = async (signalementId, texte) => {
  const response = await axiosInstance.post(`signalements/signalements/${signalementId}/comment/`, {
    body: texte,
    is_internal: false,
  })
  return normalizeComment(response.data)
}

export const updateStatut = async (id, statut) => {
  const response = await axiosInstance.post(`signalements/signalements/${id}/status/`, {
    status: STATUT_FRONT_TO_BACK[statut] || statut,
  })
  return normalizeSignalement(response.data)
}
