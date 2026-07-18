import axiosInstance from './axiosInstance'
import { normalizeUser, unwrapList } from './normalizers'


function clearAuthStorage() {
  localStorage.removeItem('eco-user')
  localStorage.removeItem('eco-token')
  localStorage.removeItem('eco-refresh-token')
  localStorage.removeItem('eco_access_token')
  localStorage.removeItem('eco_refresh_token')
}

function apiErrorMessage(error, fallback) {
  const data = error.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  const messages = Object.entries(data)
    .flatMap(([field, value]) => {
      const text = Array.isArray(value) ? value.join(' ') : String(value)
      return `${field}: ${text}`
    })
  return messages.join(' ') || fallback
}

// Construit un username stable a partir de l'email pour satisfaire le modele
// Django, tout en gardant l'email comme identifiant principal cote interface.
function usernameFromEmail(email) {
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 80)
  return `${base}_${Date.now().toString(36)}`.slice(0, 140)
}

async function resolveCommune(value) {
  if (!value) return null
  if (/^\d+$/.test(String(value))) {
    const response = await axiosInstance.get(`locations/communes/${value}/`)
    return response.data
  }
  const response = await axiosInstance.get('locations/communes/', { params: { search: value } })
  const communes = unwrapList(response.data)
  return communes.find((item) => item.name === value) || communes[0] || null
}

export const login = async (email, password) => {
  clearAuthStorage()
  try {
    const tokenResponse = await axiosInstance.post('auth/login/', { username: email.trim(), password })
    const tokens = tokenResponse.data
    localStorage.setItem('eco-token', tokens.access)
    localStorage.setItem('eco-refresh-token', tokens.refresh)
    localStorage.setItem('eco_access_token', tokens.access)
    localStorage.setItem('eco_refresh_token', tokens.refresh)

    const profileResponse = await axiosInstance.get('auth/me/')
    return normalizeUser(profileResponse.data, tokens)
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Identifiants incorrects ou compte inexistant.'))
  }
}

export const register = async (data) => {
  clearAuthStorage()
  try {
    const commune = await resolveCommune(data.commune)
    const email = data.email.trim().toLowerCase()
    const payload = {
      username: usernameFromEmail(email),
      email,
      first_name: data.prenom.trim(),
      last_name: data.nom.trim(),
      phone: data.phone.trim(),
      address_line: data.address_line?.trim() || '',
      commune: commune?.id,
      province: commune?.province,
      password: data.password,
      password_confirm: data.confirmPassword || data.password,
    }
    const response = await axiosInstance.post('auth/register/', payload)
    const tokens = response.data || {}
    if (tokens.access && tokens.user) {
      localStorage.setItem('eco-token', tokens.access)
      localStorage.setItem('eco-refresh-token', tokens.refresh)
      localStorage.setItem('eco_access_token', tokens.access)
      localStorage.setItem('eco_refresh_token', tokens.refresh)
      return normalizeUser(tokens.user, tokens)
    }
    return login(email, data.password)
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Impossible de creer le compte citoyen. Verifiez les champs saisis.'))
  }
}

export const getCurrentUser = async () => {
  const response = await axiosInstance.get('auth/me/')
  return normalizeUser(response.data, { access: localStorage.getItem('eco-token') })
}

export const updateProfile = async (data) => {
  const payload = data instanceof FormData ? data : { ...data }
  try {
    const response = await axiosInstance.patch('auth/me/', payload)
    return normalizeUser(response.data, { access: localStorage.getItem('eco-token') })
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Impossible de mettre a jour le profil.'))
  }
}
