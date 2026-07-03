// =============================================================
// src/components/Navbar.jsx — Barre de navigation supérieure
// Adaptative selon le rôle : citoyen, autorité, ou visiteur
// Inclut le sélecteur de thème et les notifications
// =============================================================
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

/**
 * Navbar — Barre de navigation principale de l'application
 * @param {function} onToggleSidebar - Callback pour ouvrir/fermer la sidebar
 * @param {boolean} sidebarCollapsed - État actuel de la sidebar
 */
const Navbar = ({ onToggleSidebar, sidebarCollapsed }) => {
  // Accès au contexte d'authentification pour afficher les infos utilisateur
  const { user, logout, isAuthenticated } = useAuth()
  // Accès au contexte de thème pour le sélecteur de thème
  const { theme, changeTheme } = useTheme()
  // Hook de navigation pour la redirection après déconnexion
  const navigate = useNavigate()

  /**
   * handleLogout — Déconnecte l'utilisateur et redirige vers l'accueil
   */
  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Icônes de thème associées à chaque mode
  const themeIcons = { light: 'bi-sun-fill', dark: 'bi-moon-fill', system: 'bi-circle-half' }

  return (
    <nav
      className="eco-navbar navbar px-4 py-2"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1030,
        minHeight: 62,
      }}
    >
      <div className="d-flex align-items-center gap-3 w-100">

        {/* ---- Bouton hamburger (uniquement sur les layouts avec sidebar) ---- */}
        {isAuthenticated() && (
          <button
            onClick={onToggleSidebar}
            className="btn btn-sm rounded-2 d-flex align-items-center justify-content-center"
            style={{ width: 38, height: 38, background: 'var(--eco-border)', border: 'none' }}
            title="Basculer la barre latérale"
          >
            <i className={`bi ${sidebarCollapsed ? 'bi-layout-sidebar' : 'bi-layout-sidebar-inset'}`}></i>
          </button>
        )}

        {/* ---- Logo et nom de l'application ---- */}
        <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
          {/* Logo généré par IA */}
          <img
            src="/logo-eco-rdc.png"
            alt="Logo Eco-RDC"
            style={{
              width: 40, height: 40,
              objectFit: 'contain',
            }}
          />
          {/* Nom complet affiché uniquement sur les grands écrans */}
          <span
            className="fw-700 d-none d-md-block"
            style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--eco-text-primary)', letterSpacing: '-0.3px' }}
          >
            Eco<span style={{ color: 'var(--eco-accent)' }}>RDC</span>
          </span>
        </Link>

        {/* ---- Espace flexible pour pousser les éléments à droite ---- */}
        <div className="flex-grow-1"></div>

        {/* ==================== ÉLÉMENTS DE DROITE ==================== */}
        <div className="d-flex align-items-center gap-2">

          {/* ---- Sélecteur de thème (dropdown Bootstrap) ---- */}
          <div className="dropdown">
            <button
              className="btn btn-sm rounded-2 d-flex align-items-center gap-2"
              style={{ background: 'var(--eco-border)', border: 'none', height: 38 }}
              data-bs-toggle="dropdown"
              aria-expanded="false"
              title="Changer le thème"
            >
              {/* Icône correspondant au thème actif */}
              <i className={`bi ${themeIcons[theme]}`} style={{ color: 'var(--eco-accent)' }}></i>
              <span className="d-none d-sm-block" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                {theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Système'}
              </span>
            </button>
            {/* Menu déroulant des thèmes */}
            <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ minWidth: 160 }}>
              {/* Option Thème Clair */}
              <li>
                <button
                  className={`dropdown-item d-flex align-items-center gap-2 ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => changeTheme('light')}
                >
                  <i className="bi bi-sun-fill text-warning"></i> Clair
                  {theme === 'light' && <i className="bi bi-check2 ms-auto"></i>}
                </button>
              </li>
              {/* Option Thème Sombre */}
              <li>
                <button
                  className={`dropdown-item d-flex align-items-center gap-2 ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => changeTheme('dark')}
                >
                  <i className="bi bi-moon-fill text-info"></i> Sombre
                  {theme === 'dark' && <i className="bi bi-check2 ms-auto"></i>}
                </button>
              </li>
              {/* Option Thème Système */}
              <li>
                <button
                  className={`dropdown-item d-flex align-items-center gap-2 ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => changeTheme('system')}
                >
                  <i className="bi bi-circle-half" style={{ color: 'var(--eco-accent)' }}></i> Système
                  {theme === 'system' && <i className="bi bi-check2 ms-auto"></i>}
                </button>
              </li>
            </ul>
          </div>

          {/* ---- Éléments pour utilisateur CONNECTÉ ---- */}
          {isAuthenticated() ? (
            <>
              {/* Bouton de notification (simulé) */}
              <button
                className="btn btn-sm rounded-2 position-relative"
                style={{ background: 'var(--eco-border)', border: 'none', width: 38, height: 38 }}
                title="Notifications"
              >
                <i className="bi bi-bell-fill" style={{ fontSize: '1rem', color: 'var(--eco-text-secondary)' }}></i>
                {/* Badge compteur de notifications */}
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                  style={{ background: 'var(--eco-danger)', fontSize: '0.6rem' }}
                >3</span>
              </button>

              {/* Dropdown profil utilisateur */}
              <div className="dropdown">
                <button
                  className="btn btn-sm rounded-2 d-flex align-items-center gap-2 px-2"
                  style={{ background: 'var(--eco-border)', border: 'none', height: 38 }}
                  data-bs-toggle="dropdown"
                >
                  {/* Avatar de l'utilisateur */}
                  <div
                    style={{
                      width: 28, height: 28,
                      borderRadius: '50%',
                      background: 'var(--eco-accent-gradient)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', color: '#fff', fontWeight: 700,
                    }}
                  >
                    {/* Initiale du nom de l'utilisateur */}
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  {/* Nom de l'utilisateur (masqué sur mobile) */}
                  <span className="d-none d-md-block" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    {user?.name?.split(' ')[0]}
                  </span>
                  <i className="bi bi-chevron-down" style={{ fontSize: '0.7rem' }}></i>
                </button>
                {/* Menu déroulant du profil */}
                <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ minWidth: 200 }}>
                  <li className="px-3 py-2">
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)' }}>
                      {user?.role === 'autorite' ? '🏛️ Autorité Urbaine' : '🌱 Éco-Citoyen'} — {user?.commune}
                    </div>
                  </li>
                  <li><hr className="dropdown-divider my-1" /></li>
                  <li>
                    <Link to="/profile" className="dropdown-item d-flex align-items-center gap-2">
                      <i className="bi bi-person-circle"></i> Mon Profil
                    </Link>
                  </li>
                  <li>
                    <Link to="/settings" className="dropdown-item d-flex align-items-center gap-2">
                      <i className="bi bi-gear-fill"></i> Paramètres
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider my-1" /></li>
                  <li>
                    <button onClick={handleLogout} className="dropdown-item text-danger d-flex align-items-center gap-2">
                      <i className="bi bi-box-arrow-right"></i> Déconnexion
                    </button>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            /* ---- Boutons pour visiteur NON CONNECTÉ ---- */
            <div className="d-flex gap-2">
              <Link to="/login" className="btn btn-sm btn-outline-secondary rounded-2">
                Connexion
              </Link>
              <Link to="/register" className="btn-eco btn btn-sm rounded-2">
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
