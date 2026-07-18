// Instance Axios centrale.
// Toutes les pages passent par ce fichier afin que l'URL API, le JWT et les
// erreurs d'authentification restent geres a un seul endroit.
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    Accept: 'application/json',
  },
})

const PUBLIC_AUTH_PATHS = ['auth/login/', 'auth/register/', 'auth/refresh/']

function isPublicAuthRequest(url = '') {
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path))
}

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('eco-token') || localStorage.getItem('eco_access_token')
  // Les routes publiques d'authentification ne doivent jamais recevoir un
  // ancien Bearer token. Un token expire peut provoquer un 401 avant meme que
  // Django ne valide les identifiants envoyes.
  if (token && !isPublicAuthRequest(config.url || '')) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('eco-user')
      localStorage.removeItem('eco-token')
      localStorage.removeItem('eco-refresh-token')
      localStorage.removeItem('eco_access_token')
      localStorage.removeItem('eco_refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
