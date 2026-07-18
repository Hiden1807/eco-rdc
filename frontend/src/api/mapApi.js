import axiosInstance from './axiosInstance'
import { normalizeSignalement, unwrapList } from './normalizers'

export const KINSHASA_CENTER = { lat: -4.3225, lng: 15.3222 }
export const COMMUNES_COORDS = {}

export const getMapIncidents = async (filters = {}) => {
  // Les filtres envoyes au backend utilisent les noms exacts des champs Django:
  // `commune` et `category` attendent les identifiants de base de donnees.
  const params = {
    commune: filters.commune || undefined,
    category: filters.category || filters.typeId || undefined,
    status: filters.status || undefined,
    gravity: filters.gravity || undefined,
  }
  const response = await axiosInstance.get('signalements/signalements/map/', { params })
  return unwrapList(response.data).map(normalizeSignalement)
}
