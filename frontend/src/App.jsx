// =============================================================
// src/App.jsx — Composant racine de l'application React
// Enveloppe l'application avec les providers de contexte globaux
// =============================================================
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes/AppRoutes'

/**
 * App — Composant racine qui configure :
 * 1. BrowserRouter — Système de routage (React Router v6)
 * 2. ThemeProvider — Gestion globale du thème Clair/Sombre/Système
 * 3. AuthProvider — Gestion de la session utilisateur et des rôles
 * 4. AppRoutes — Toutes les routes de l'application
 */
const App = () => {
  return (
    // BrowserRouter active le routage basé sur l'URL du navigateur
    <BrowserRouter>
      {/* ThemeProvider fournit le contexte de thème à tous les composants */}
      <ThemeProvider>
        {/* AuthProvider fournit le contexte d'authentification à tous les composants */}
        <AuthProvider>
          {/* AppRoutes définit toutes les routes et leurs layouts */}
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
