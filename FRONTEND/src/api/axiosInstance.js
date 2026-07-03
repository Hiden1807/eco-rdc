// =============================================================
// src/api/axiosInstance.js — Instance Axios centralisée
// Configure la base URL et l'injection automatique du token JWT
// ⚠️ LIAISON BACKEND : Modifier BASE_URL pour pointer vers Django
// =============================================================
import axios from 'axios'

// 🔧 BACKEND: Remplacer par l'URL réelle de l'API Django ex: 'http://localhost:8000/api/'
const BASE_URL = 'http://localhost:8000/api/'

// Création de l'instance Axios avec configuration de base
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Délai max de 15 secondes pour chaque requête
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// INTERCEPTEUR DE REQUÊTE : Injecte le token JWT dans chaque requête
axiosInstance.interceptors.request.use(
  (config) => {
    // Récupère le token stocké lors de la connexion
    const token = localStorage.getItem('eco-token')
    if (token) {
      // 🔧 BACKEND: Format attendu par Django REST Framework avec djangorestframework-simplejwt
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// INTERCEPTEUR DE RÉPONSE : Gère l'expiration de session (401)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré : efface la session et redirige vers login
      localStorage.removeItem('eco-user')
      localStorage.removeItem('eco-token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
