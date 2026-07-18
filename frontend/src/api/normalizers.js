// Adaptateurs de contrat entre le frontend du collaborateur et l'API Django.
// Le backend reste la source de verite; ces fonctions ne creent pas de donnees,
// elles renomment seulement les champs pour conserver les composants existants.

export const STATUT_FRONT_TO_BACK = {
  nouveau: 'en_attente',
  en_traitement: 'en_cours',
  valide: 'valide',
  resolu: 'resolu',
  rejete: 'rejete',
}

export const STATUT_BACK_TO_FRONT = Object.fromEntries(
  Object.entries(STATUT_FRONT_TO_BACK).map(([front, back]) => [back, front])
)

export const GRAVITY_BACK_TO_LEVEL = {
  faible: 1,
  moyen: 2,
  eleve: 3,
  critique: 4,
}

export const GRAVITY_LEVEL_TO_BACK = {
  1: 'faible',
  2: 'moyen',
  3: 'eleve',
  4: 'critique',
  5: 'critique',
}

export function unwrapList(payload) {
  if (Array.isArray(payload)) return payload
  return payload?.results || []
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/'
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return ''
  }
})()

export function normalizeMediaUrl(value) {
  if (!value || typeof value !== 'string') return value || ''
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:') || value.startsWith('blob:')) {
    return value
  }
  if (!API_ORIGIN) return value
  if (value.startsWith('/')) return `${API_ORIGIN}${value}`
  if (value.startsWith('media/')) return `${API_ORIGIN}/${value}`
  return value
}

export function fullName(user) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || user?.username || user?.email || ''
}

export function normalizeUser(user, tokenPayload = {}) {
  if (!user) return null
  return {
    ...user,
    name: fullName(user),
    token: tokenPayload.access,
    refresh: tokenPayload.refresh,
    avatar: normalizeMediaUrl(user.avatar),
    commune: user.commune_name || user.commune,
    province: user.province_name || user.province,
    stats: user.stats || {},
  }
}

export function normalizeCommune(item) {
  return {
    id: item.id,
    name: item.name,
    province: item.province,
    provinceName: item.province_name,
    lat: Number(item.centroid_latitude),
    lng: Number(item.centroid_longitude),
    score: item.ecological_score,
    risk: item.risk_level,
  }
}

export function normalizeCategory(item) {
  return {
    id: item.id,
    value: item.slug,
    label: item.name,
    icon: iconForCategory(item.slug),
    color: item.color || '#2d7a4e',
  }
}

export function normalizeSignalement(item) {
  const category = item.category_name || item.category?.name || item.detected_category_label || ''
  const slug = item.category?.slug || slugify(category)
  const comments = (item.comments || []).map(normalizeComment)
  const history = (item.status_history || []).map(normalizeStatusHistory)
  return {
    ...item,
    titre: item.title,
    title: item.title,
    type: slug,
    typeLabel: category,
    commune: item.commune_name || item.commune?.name || item.commune || item['commune__name'] || '',
    province: item.province_name || item.province?.name || item.province || item['province__name'] || '',
    description: item.description || '',
    statut: STATUT_BACK_TO_FRONT[item.status] || item.status || 'nouveau',
    status: item.status,
    photo: normalizeMediaUrl(item.photo),
    gravite: GRAVITY_BACK_TO_LEVEL[item.gravity] || Number(item.gravite || 2),
    graviteLabel: gravityLabel(item.gravity),
    lat: Number(item.latitude ?? item.lat),
    lng: Number(item.longitude ?? item.lng),
    date: item.created_at || item.date || item.createdAt,
    photoUrl: normalizeMediaUrl(item.photo),
    iaAnalyse: item.ai_summary || item.summary || '',
    recommandation: item.ai_recommendation || item.recommendation || '',
    commentaires: [...comments, ...history].sort((a, b) => new Date(a.date) - new Date(b.date)),
    signalePar: item.created_by || item.citizen_name || item.citizen,
    adresseExacte: item.address_text || item.exact_address || '',
  }
}

export function normalizeComment(item = {}) {
  return {
    id: item.id,
    auteur: item.author_name || item.changed_by_name || 'Autorite',
    texte: item.body || item.comment || '',
    isInternal: Boolean(item.is_internal),
    date: item.created_at,
    type: 'commentaire',
  }
}

export function normalizeStatusHistory(item = {}) {
  return {
    id: `history-${item.id}`,
    auteur: item.changed_by_name || 'Systeme',
    texte: item.comment || `Statut mis a jour: ${item.new_status}`,
    date: item.created_at,
    type: 'statut',
  }
}

export function normalizeDashboardList(rows, nameKey = 'name') {
  return (rows || []).map((row) => ({
    ...row,
    name: row[nameKey] || row.name || row.commune || row.status || row.detected_category_label || 'Non classe',
    total: row.total ?? row.count ?? row.signalements ?? 0,
  }))
}

export function slugify(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function iconForCategory(slug = '') {
  if (slug.includes('inond')) return 'bi-water'
  if (slug.includes('erosion')) return 'bi-exclamation-triangle'
  if (slug.includes('pollution')) return 'bi-droplet-half'
  if (slug.includes('air') || slug.includes('brul')) return 'bi-fire'
  if (slug.includes('caniveau')) return 'bi-cone-striped'
  return 'bi-trash3'
}

function gravityLabel(value) {
  return {
    faible: 'Faible',
    moyen: 'Modere',
    eleve: 'Eleve',
    critique: 'Critique',
  }[value] || 'Modere'
}
