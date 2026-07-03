// =============================================================
// src/context/ThemeContext.jsx — Contexte React global pour le thème
// Gère le basculement Clair / Sombre / Système et persiste en localStorage
// =============================================================
import React, { createContext, useContext, useState, useEffect } from 'react'

// Création du contexte de thème
const ThemeContext = createContext()

/**
 * ThemeProvider — Enveloppe l'application pour fournir le contexte de thème
 * @param {React.ReactNode} children - Les composants enfants à envelopper
 */
export function ThemeProvider({ children }) {
  // État du thème : 'light', 'dark', ou 'system'
  // Récupère la préférence sauvegardée depuis le localStorage, sinon 'system' par défaut
  const [theme, setTheme] = useState(() => localStorage.getItem('eco-theme') || 'system')

  // Effet : applique le thème sur <html> chaque fois que l'état change
  useEffect(() => {
    // Détermine le thème effectif (résout 'system' en 'light' ou 'dark')
    const resolveTheme = () => {
      if (theme === 'system') {
        // Interroge la préférence système de l'OS de l'utilisateur
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return theme
    }

    const effectiveTheme = resolveTheme()
    // Applique l'attribut Bootstrap 5 sur <html> pour le thème
    document.documentElement.setAttribute('data-bs-theme', effectiveTheme)
    // Persiste la préférence de l'utilisateur dans le localStorage
    localStorage.setItem('eco-theme', theme)

    // Écoute les changements de préférence système si 'system' est sélectionné
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => {
        document.documentElement.setAttribute('data-bs-theme', mediaQuery.matches ? 'dark' : 'light')
      }
      mediaQuery.addEventListener('change', handler)
      // Nettoyage de l'écouteur lors du démontage du composant
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [theme]) // Se déclenche à chaque changement de 'theme'

  /**
   * changeTheme — Modifie le thème actif
   * @param {'light'|'dark'|'system'} newTheme - Le nouveau thème à appliquer
   */
  const changeTheme = (newTheme) => setTheme(newTheme)

  // Valeurs exposées au reste de l'application via le contexte
  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Hook personnalisé pour accéder facilement au contexte de thème
export const useTheme = () => useContext(ThemeContext)
