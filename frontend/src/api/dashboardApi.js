import axiosInstance from './axiosInstance'
import { normalizeDashboardList, normalizeSignalement } from './normalizers'


export const getStatsCitoyen = async () => {
  const response = await axiosInstance.get('dashboard/citoyen/')
  const data = response.data
  return {
    totalSignalements: data.total || 0,
    resolus: data.resolved || 0,
    enCours: data.in_progress || 0,
    rejetes: data.rejected || 0,
    pointsEco: Math.max(0, (data.resolved || 0) * 40 + (data.total || 0) * 10),
    rang: (data.resolved || 0) >= 10 ? 'Eco-Citoyen Or' : (data.resolved || 0) >= 3 ? 'Eco-Citoyen Argent' : 'Eco-Citoyen Bronze',
    communeActive: '',
    timeline: (data.latest || []).map(normalizeSignalement),
  }
}

export const getStatsAutorite = async () => {
  const response = await axiosInstance.get('dashboard/autorite/')
  const data = response.data
  const total = data.zone_total || 0
  const resolvedRow = (data.by_status || []).find((row) => row.status === 'resolu')
  const resolus = resolvedRow?.total || 0
  return {
    totalSignalements: total,
    traites: resolus,
    urgences: data.critical || 0,
    tauxResolution: total ? Math.round((resolus / total) * 100) : 0,
    tempsMoyenTraitement: 'Selon historique',
    performanceCommunes: normalizeDashboardList(data.by_category || [], 'detected_category_label').map((row) => ({
      commune: row.name,
      signalements: row.total,
      resolus: 0,
      taux: 0,
    })),
    urgencesActuelles: (data.urgent_list || []).map(normalizeSignalement).map((item) => ({
      id: item.id,
      titre: item.titre,
      type: item.type,
      gravite: item.gravite,
      commune: item.commune,
      priorite: item.gravite >= 4 ? 'CRITIQUE' : 'HAUTE',
    })),
  }
}

export const getEvolutionStats = async () => {
  const response = await axiosInstance.get('dashboard/public/')
  const data = response.data
  const total = data.total || 0
  const resolved = data.resolved || 0
  return {
    mensuel: (data.evolution || []).map((row) => ({
      mois: new Date(row.day).toLocaleDateString('fr-FR', { month: 'short', day: '2-digit' }),
      signalements: row.total,
      resolus: row.resolved || 0,
      dechets: Math.max(0, Math.round((row.total || 0) * 0.45 * 10) / 10),
    })),
    parType: normalizeDashboardList(data.top_categories || [], 'detected_category_label').map((row) => ({
      type: row.name,
      count: row.total,
      pct: total ? Math.round((row.total / total) * 100) : 0,
    })),
    zonesInondables: (data.risk_zones || []).map((row) => ({
      commune: row.commune__name,
      risque: Math.min(100, (row.critical || 0) * 20 + (row.incidents || 0) * 6),
    })),
    resume: {
      total,
      resolved,
      active: data.active || 0,
      critical: data.critical || 0,
      communes: data.communes_count || 0,
    },
  }
}
