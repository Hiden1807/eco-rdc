// =============================================================
// src/context/AuthContext.jsx — Contexte d'authentification global
// Gère la session utilisateur (connexion, déconnexion, rôle)
// =============================================================
import React, { createContext, useContext, useState, useEffect } from 'react'

// Création du contexte d'authentification
const AuthContext = createContext()

/**
 * AuthProvider — Fournit l'état d'authentification à l'ensemble de l'appli
 */
export function AuthProvider({ children }) {
  // État : l'utilisateur connecté (null si non connecté)
  // Structure : { id, name, email, role: 'citoyen'|'autorite'|'ministere'|'admin', commune, avatar, token }
  const [user, setUser] = useState(() => {
    // Tente de restaurer la session depuis le localStorage
    try {
      const saved = localStorage.getItem('eco-user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // État : indique si l'initialisation est terminée (évite le flash de contenu)
  const [authLoading, setAuthLoading] = useState(false)

  /**
   * login — Connecte l'utilisateur et persiste la session
   * @param {Object} userData - Les données de l'utilisateur à connecter
   */
  const login = (userData) => {
    setUser(userData)
    // Persiste la session dans le localStorage
    localStorage.setItem('eco-user', JSON.stringify(userData))
    // Persiste uniquement un vrai JWT retourne par le backend.
    if (userData.token) localStorage.setItem('eco-token', userData.token)
    if (userData.refresh) localStorage.setItem('eco-refresh-token', userData.refresh)
  }

  /**
   * logout — Déconnecte l'utilisateur et efface la session
   */
  const logout = () => {
    setUser(null)
    // Efface toutes les données de session
    localStorage.removeItem('eco-user')
    localStorage.removeItem('eco-token')
    localStorage.removeItem('eco-refresh-token')
    localStorage.removeItem('eco_access_token')
    localStorage.removeItem('eco_refresh_token')
  }

  /**
   * isAuthenticated — Vérifie si l'utilisateur est connecté
   * @returns {boolean}
   */
  const isAuthenticated = () => !!user

  /**
   * hasRole — Vérifie si l'utilisateur possède un rôle spécifique
   * @param {string} role - Le rôle à vérifier ('citoyen', 'autorite', 'ministere' ou 'admin')
   * @returns {boolean}
   */
  const hasRole = (role) => user?.role === role

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, hasRole, authLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personnalisé pour accéder facilement au contexte d'auth
export const useAuth = () => useContext(AuthContext)
