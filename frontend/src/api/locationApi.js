import axiosInstance from './axiosInstance'
import { normalizeCommune, unwrapList } from './normalizers'

export const getProvinces = async (params = {}) => {
  const response = await axiosInstance.get('locations/provinces/', { params })
  return unwrapList(response.data)
}

// Toutes les communes affichees dans l'interface viennent du backend.
// Les creations restent protegees par les permissions Django cote serveur.
export const getCommunes = async (params = {}) => {
  const response = await axiosInstance.get('locations/communes/', { params })
  return unwrapList(response.data).map(normalizeCommune)
}

export const createCommune = async (payload) => {
  const response = await axiosInstance.post('locations/communes/', payload)
  return normalizeCommune(response.data)
}
