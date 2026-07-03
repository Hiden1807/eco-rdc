// =============================================================
// src/routes/AppRoutes.jsx — Configuration complète du routage
// Définit toutes les routes publiques et protégées de l'application
// =============================================================
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// ---- Layouts ----
import PublicLayout from '../layouts/PublicLayout'
import DashboardLayout from '../layouts/DashboardLayout'

// ---- Pages Publiques ----
import Home from '../pages/Home'
import Login from '../pages/Login'
import Register from '../pages/Register'
import MapPage from '../pages/MapPage'
import Statistics from '../pages/Statistics'
import Education from '../pages/Education'
import NotFound from '../pages/NotFound'
import AIAnalysis from '../pages/AIAnalysis'

// ---- Pages Tableau de Bord (Protégées) ----
import CitizenDashboard from '../pages/CitizenDashboard'
import AuthorityDashboard from '../pages/AuthorityDashboard'
import NewSignalement from '../pages/NewSignalement'
import MySignalements from '../pages/MySignalements'
import SignalementDetails from '../pages/SignalementDetails'
import Profile from '../pages/Profile'
import Settings from '../pages/Settings'

import { useAuth } from '../context/AuthContext'

/**
 * PrivateRoute — Composant de protection de route selon le rôle
 * @param {string} role - Rôle requis pour accéder ('citoyen', 'autorite', ou undefined pour tout connecté)
 * @param {React.ReactNode} children - Contenu à afficher si autorisé
 */
const PrivateRoute = ({ children, role }) => {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  // Si un rôle spécifique est requis et que l'utilisateur ne l'a pas
  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'autorite' ? '/authority-dashboard' : '/citizen-dashboard'} replace />
  }
  return children
}

/**
 * AppRoutes — Définit toute la structure de routage de l'application
 */
const AppRoutes = () => {
  const { user } = useAuth()

  return (
    <Routes>

      {/* ==================== ROUTES PUBLIQUES ==================== */}
      {/* Toutes ces routes utilisent le PublicLayout (sans sidebar) */}
      <Route element={<PublicLayout />}>
        {/* Page d'accueil */}
        <Route path="/" element={<Home />} />

        {/* Pages d'authentification — redirigent si déjà connecté */}
        <Route path="/login" element={
          user ? <Navigate to={user.role === 'autorite' ? '/authority-dashboard' : '/citizen-dashboard'} replace /> : <Login />
        } />
        <Route path="/register" element={
          user ? <Navigate to={user.role === 'autorite' ? '/authority-dashboard' : '/citizen-dashboard'} replace /> : <Register />
        } />

        {/* Pages publiques accessibles sans connexion */}
        <Route path="/map" element={<MapPage />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/education" element={<Education />} />
      </Route>

      {/* ==================== ROUTES TABLEAU DE BORD (PROTÉGÉES) ==================== */}
      {/* Toutes ces routes utilisent DashboardLayout (avec sidebar) */}
      {/* DashboardLayout lui-même protège les routes avec un check d'auth */}
      <Route element={<DashboardLayout />}>

        {/* ---- Tableau de bord Citoyen ---- */}
        <Route path="/citizen-dashboard" element={
          <PrivateRoute role="citoyen"><CitizenDashboard /></PrivateRoute>
        } />

        {/* ---- Tableau de bord Autorité ---- */}
        <Route path="/authority-dashboard" element={
          <PrivateRoute role="autorite"><AuthorityDashboard /></PrivateRoute>
        } />

        {/* ---- Gestion des Signalements (accessible aux deux rôles) ---- */}
        <Route path="/signalements" element={
          <PrivateRoute><MySignalements /></PrivateRoute>
        } />
        <Route path="/signalements/new" element={
          <PrivateRoute><NewSignalement /></PrivateRoute>
        } />
        <Route path="/signalements/:id" element={
          <PrivateRoute><SignalementDetails /></PrivateRoute>
        } />
        <Route path="/ai-analysis" element={
          <PrivateRoute><AIAnalysis /></PrivateRoute>
        } />

        {/* ---- Profil et Paramètres ---- */}
        <Route path="/profile" element={
          <PrivateRoute><Profile /></PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute><Settings /></PrivateRoute>
        } />
      </Route>

      {/* ==================== PAGE 404 ==================== */}
      {/* Catch-all : toute URL inconnue affiche la page 404 */}
      <Route path="*" element={<NotFound />} />

    </Routes>
  )
}

export default AppRoutes
