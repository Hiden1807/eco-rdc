// =============================================================
// src/layouts/DashboardLayout.jsx — Disposition asymétrique avec sidebar
// Utilisée pour toutes les pages du tableau de bord (connecté)
// =============================================================
import React, { useState, useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'

/**
 * DashboardLayout — Disposition asymétrique avec Sidebar fixe + contenu principal
 * Protège les routes : redirige vers /login si l'utilisateur n'est pas connecté
 */
const DashboardLayout = () => {
  // Accès au contexte d'authentification pour la protection de route
  const { isAuthenticated } = useAuth()

  // État de la sidebar : collapsed (réduite) ou expansée
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  // État pour l'affichage mobile de la sidebar
  const [mobileOpen, setMobileOpen] = useState(false)
  // État pour détecter si on est sur mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Effet : écoute le redimensionnement de la fenêtre pour adapter la sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Ferme automatiquement la sidebar si on repasse en mode desktop
      if (!mobile) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize) // Nettoyage
  }, [])

  /**
   * toggleSidebar — Bascule l'état de la sidebar (collapsed / expanded / mobile)
   */
  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev) // Sur mobile: ouvre/ferme complètement
    } else {
      setSidebarCollapsed((prev) => !prev) // Sur desktop: réduit/agrandit
    }
  }

  // PROTECTION DE ROUTE : Redirige vers /login si l'utilisateur n'est pas connecté
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return (
    // Conteneur principal de la disposition asymétrique
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--eco-bg-primary)' }}>

      {/* ---- SIDEBAR FIXE À GAUCHE ---- */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* ---- ZONE PRINCIPALE (Navbar + Contenu) ---- */}
      <div
        className={`eco-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {/* Navbar supérieure avec bouton hamburger */}
        <Navbar
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Zone de contenu — Outlet injecte la page de la route active */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
