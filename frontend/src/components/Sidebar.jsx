// =============================================================
// src/components/Sidebar.jsx — Barre latérale de navigation
// Menu contextuel selon le rôle : citoyen ou autorité urbaine
// Supporte le mode collapsed (réduit) pour plus d'espace de travail
// =============================================================
import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UserAvatar from './UserAvatar'

/**
 * Sidebar — Barre de navigation latérale adaptative
 * @param {boolean} collapsed - Si true, affiche uniquement les icônes
 * @param {boolean} mobileOpen - Si true, la sidebar est visible sur mobile
 * @param {function} onClose - Callback pour fermer la sidebar sur mobile
 */
const Sidebar = ({ collapsed = false, mobileOpen = false, onClose }) => {
  // Accès au contexte d'authentification pour les menus selon le rôle
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  /**
   * handleLogout — Déconnecte et redirige vers l'accueil
   */
  const handleLogout = () => {
    logout()
    onClose?.()
    navigate('/')
  }

  // ---- MENU POUR LE CITOYEN ----
  const menuCitoyen = [
    { to: '/citizen-dashboard', icon: 'bi-speedometer2', label: 'Tableau de Bord' },
    { to: '/signalements/new', icon: 'bi-plus-circle-fill', label: 'Signaler un Incident', highlight: true },
    { to: '/signalements', icon: 'bi-collection-fill', label: 'Mes Signalements' },
    { to: '/map', icon: 'bi-map-fill', label: 'Carte Écologique' },
    { to: '/statistics', icon: 'bi-bar-chart-fill', label: 'Statistiques' },
    { to: '/education', icon: 'bi-book-fill', label: 'Guides Écologiques' },
  ]

  // ---- MENU POUR L'AUTORITÉ URBAINE ----
  const menuAutorite = [
    { to: '/authority-dashboard', icon: 'bi-shield-fill-check', label: 'Centre de Contrôle' },
    { to: '/signalements', icon: 'bi-exclamation-triangle-fill', label: 'Tous les Incidents' },
    { to: '/map', icon: 'bi-map-fill', label: 'Carte SIG Kinshasa' },
    { to: '/ai-analysis', icon: 'bi-magic', label: 'Analyse IA' },
    { to: '/notifications', icon: 'bi-bell-fill', label: 'Notifications' },
    { to: '/publications', icon: 'bi-megaphone-fill', label: 'Publications' },
    { to: '/statistics', icon: 'bi-graph-up-arrow', label: 'Analyses & Stats' },
    { to: '/education', icon: 'bi-megaphone-fill', label: 'Communication' },
  ]

  // ---- MENU POUR LE MINISTERE ET L'ADMINISTRATION ----
  const menuInstitution = [
    { to: '/admin-dashboard', icon: 'bi-buildings-fill', label: 'Supervision' },
    { to: '/authority-dashboard', icon: 'bi-speedometer2', label: 'Operations' },
    { to: '/signalements', icon: 'bi-exclamation-triangle-fill', label: 'Signalements' },
    { to: '/map', icon: 'bi-map-fill', label: 'Carte nationale' },
    { to: '/ai-analysis', icon: 'bi-cpu-fill', label: 'IA predictive' },
    { to: '/notifications', icon: 'bi-bell-fill', label: 'Notifications' },
    { to: '/publications', icon: 'bi-megaphone-fill', label: 'Publications' },
    { to: '/reports', icon: 'bi-file-earmark-bar-graph-fill', label: 'Rapports' },
    { to: '/statistics', icon: 'bi-graph-up-arrow', label: 'Statistiques' },
  ]

  // Sélectionne le menu selon le rôle de l'utilisateur connecté
  const menuItems = ['ministere', 'admin'].includes(user?.role) ? menuInstitution : user?.role === 'autorite' ? menuAutorite : menuCitoyen

  // ---- MENU DE BAS DE SIDEBAR (commun) ----
  const menuBottom = [
    { to: '/profile', icon: 'bi-person-circle', label: 'Mon Profil' },
    { to: '/settings', icon: 'bi-gear-fill', label: 'Paramètres' },
  ]

  return (
    <>
      {/* Superposition sombre sur mobile pour fermer la sidebar */}
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 2040,
            display: 'block',
          }}
        />
      )}

      {/* ==================== SIDEBAR PRINCIPALE ==================== */}
      <aside
        className={`eco-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* ---- EN-TÊTE DE LA SIDEBAR ---- */}
        <div
          className="d-flex align-items-center gap-3 px-3 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Logo généré par IA */}
          <img
            src="/logo-eco-rdc.png"
            alt="Logo Eco-RDC"
            style={{
              width: collapsed ? 44 : 52,
              height: collapsed ? 44 : 52,
              objectFit: 'contain',
              transition: 'all 0.3s ease',
            }}
          />

          {/* Nom de l'application (masqué si collapsed) */}
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.05rem', lineHeight: 1.1 }}>
                EcoRDC
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--eco-sidebar-text)', opacity: 0.8, letterSpacing: '0.5px' }}>
                INTELLIGENCE
              </div>
            </div>
          )}

          {mobileOpen && (
            <button type="button" className="eco-sidebar-close d-md-none" onClick={onClose} aria-label="Fermer le menu">
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>

        {/* ---- BADGE DE RÔLE UTILISATEUR ---- */}
        {!collapsed && user && (
          <div className="px-3 py-3">
            <div
              style={{
                background: user.role === 'autorite' ? 'rgba(255,193,7,0.15)' : 'rgba(76,175,128,0.15)',
                border: `1px solid ${user.role === 'autorite' ? 'rgba(255,193,7,0.3)' : 'rgba(76,175,128,0.3)'}`,
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <UserAvatar user={user} size={38} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>
                    {user.role === 'admin' ? 'Administration' : user.role === 'ministere' ? 'Ministere' : user.role === 'autorite' ? 'Autorite Urbaine' : 'Eco-Citoyen'}
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.commune || user.organization || 'ECO RDC'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---- MENU PRINCIPAL ---- */}
        <nav className="px-2 flex-grow-1" style={{ paddingTop: 8 }}>
          {/* Label de section (masqué si collapsed) */}
          {!collapsed && (
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', padding: '8px 10px 4px', textTransform: 'uppercase' }}>
              Navigation
            </div>
          )}

          {/* Boucle sur les éléments du menu principal */}
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${item.highlight ? 'eco-gradient text-white' : ''}`
              }
              title={collapsed ? item.label : undefined} // Tooltip en mode collapsed
              onClick={onClose} // Ferme sur mobile après navigation
              style={item.highlight ? {
                margin: '8px',
                boxShadow: '0 4px 15px rgba(76, 175, 128, 0.35)',
              } : {}}
            >
              {/* Icône du menu */}
              <i className={`bi ${item.icon}`}></i>
              {/* Label (masqué si collapsed) */}
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* ---- MENU BAS (Profil, Paramètres, Déconnexion) ---- */}
        <div
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, paddingBottom: 8 }}
        >
          {/* Label de section (masqué si collapsed) */}
          {!collapsed && (
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', padding: '4px 12px 4px', textTransform: 'uppercase' }}>
              Compte
            </div>
          )}

          {/* Liens de bas de sidebar */}
          {menuBottom.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={onClose}
            >
              <i className={`bi ${item.icon}`}></i>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}

          {/* Bouton de déconnexion */}
          <button
            onClick={handleLogout}
            className={`sidebar-link w-100 ${collapsed ? 'text-center' : 'text-start'}`}
            title={collapsed ? 'Déconnexion' : undefined}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ff6b6b' }}
          >
            <i className="bi bi-box-arrow-right"></i>
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
