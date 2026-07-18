// =============================================================
// src/components/Navbar.jsx - Barre de navigation publique et connectee
// Notifications, menus publics et profil sont relies aux API/backend.
// =============================================================
import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getUnreadNotificationCount } from '../api/notificationApi'
import UserAvatar from './UserAvatar'

const roleLabel = {
  admin: 'Administration',
  ministere: 'Ministere',
  autorite: 'Autorite',
  citoyen: 'Citoyen',
}

const publicLinks = [
  { to: '/map', icon: 'bi-map-fill', label: 'Carte SIG' },
  { to: '/education', icon: 'bi-book-fill', label: 'Education' },
  { to: '/statistics', icon: 'bi-bar-chart-fill', label: 'Statistiques' },
  { to: '/publications', icon: 'bi-megaphone-fill', label: 'Publications' },
]

const Navbar = ({ onToggleSidebar, sidebarCollapsed }) => {
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, changeTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [publicMenuOpen, setPublicMenuOpen] = useState(false)

  useEffect(() => {
    if (!user) return undefined
    const refresh = () => getUnreadNotificationCount().then(setUnreadCount).catch(() => setUnreadCount(0))
    refresh()
    const timer = setInterval(refresh, 15000)
    return () => clearInterval(timer)
  }, [user?.id])

  useEffect(() => {
    setPublicMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const themeIcons = { light: 'bi-sun-fill', dark: 'bi-moon-fill', system: 'bi-circle-half' }

  return (
    <nav className="eco-navbar navbar px-3 px-md-4 py-2" style={{ position: 'sticky', top: 0, zIndex: 2090, minHeight: 62 }}>
      <div className="d-flex align-items-center gap-3 w-100">
        {isAuthenticated() && (
          <button
            onClick={onToggleSidebar}
            className="btn btn-sm rounded-2 d-flex align-items-center justify-content-center eco-menu-toggle"
            style={{ background: 'var(--eco-border)', border: 'none' }}
            aria-label="Ouvrir le menu"
            title="Basculer la barre laterale"
          >
            <i className={`bi ${sidebarCollapsed ? 'bi-layout-sidebar' : 'bi-layout-sidebar-inset'}`}></i>
            <span className="eco-menu-toggle-text ms-2">Menu</span>
          </button>
        )}

        <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
          <img src="/logo-eco-rdc.png" alt="Logo Eco-RDC" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <span className="fw-700 d-none d-md-block" style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--eco-text-primary)' }}>
            Eco<span style={{ color: 'var(--eco-accent)' }}>RDC</span>
          </span>
        </Link>

        {!isAuthenticated() && (
          <div className="d-none d-lg-flex align-items-center gap-3 ms-3" style={{ fontSize: '0.86rem', fontWeight: 600 }}>
            {publicLinks.map((item) => (
              <Link key={item.to} to={item.to} className="text-decoration-none" style={{ color: 'var(--eco-text-secondary)' }}>{item.label}</Link>
            ))}
          </div>
        )}

        <div className="flex-grow-1"></div>

        <div className="d-flex align-items-center gap-2">
          <div className="dropdown">
            <button className="btn btn-sm rounded-2 d-flex align-items-center gap-2" style={{ background: 'var(--eco-border)', border: 'none', height: 38 }} data-bs-toggle="dropdown" aria-expanded="false" title="Changer le theme">
              <i className={`bi ${themeIcons[theme]}`} style={{ color: 'var(--eco-accent)' }}></i>
              <span className="d-none d-sm-block" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                {theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Systeme'}
              </span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ minWidth: 160 }}>
              {[
                { key: 'light', label: 'Clair', icon: 'bi-sun-fill text-warning' },
                { key: 'dark', label: 'Sombre', icon: 'bi-moon-fill text-info' },
                { key: 'system', label: 'Systeme', icon: 'bi-circle-half' },
              ].map((item) => (
                <li key={item.key}>
                  <button className={`dropdown-item d-flex align-items-center gap-2 ${theme === item.key ? 'active' : ''}`} onClick={() => changeTheme(item.key)}>
                    <i className={`bi ${item.icon}`}></i> {item.label}
                    {theme === item.key && <i className="bi bi-check2 ms-auto"></i>}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {isAuthenticated() ? (
            <>
              <Link to="/notifications" className="btn btn-sm rounded-2 position-relative d-flex align-items-center justify-content-center" style={{ background: 'var(--eco-border)', border: 'none', width: 38, height: 38 }} title="Notifications">
                <i className="bi bi-bell-fill" style={{ fontSize: '1rem', color: 'var(--eco-text-secondary)' }}></i>
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.62rem' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              <div className="dropdown">
                <button className="btn btn-sm rounded-2 d-flex align-items-center gap-2 px-2" style={{ background: 'var(--eco-border)', border: 'none', height: 38 }} data-bs-toggle="dropdown">
                  <UserAvatar user={user} size={28} preview={false} />
                  <span className="d-none d-md-block" style={{ fontSize: '0.85rem', fontWeight: 500 }}>{user?.name?.split(' ')[0]}</span>
                  <i className="bi bi-chevron-down" style={{ fontSize: '0.7rem' }}></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ minWidth: 220 }}>
                  <li className="px-3 py-2 d-flex align-items-center gap-3">
                    <UserAvatar user={user} size={44} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)' }}>
                        {roleLabel[user?.role] || 'Utilisateur'} - {user?.commune || user?.organization || 'ECO RDC'}
                      </div>
                    </div>
                  </li>
                  <li><hr className="dropdown-divider my-1" /></li>
                  <li><Link to="/profile" className="dropdown-item d-flex align-items-center gap-2"><i className="bi bi-person-circle"></i>Mon profil</Link></li>
                  <li><Link to="/settings" className="dropdown-item d-flex align-items-center gap-2"><i className="bi bi-gear-fill"></i>Parametres</Link></li>
                  <li><hr className="dropdown-divider my-1" /></li>
                  <li><button onClick={handleLogout} className="dropdown-item text-danger d-flex align-items-center gap-2"><i className="bi bi-box-arrow-right"></i>Deconnexion</button></li>
                </ul>
              </div>
            </>
          ) : (
            <>
            <button
              type="button"
              className="btn btn-sm rounded-2 d-lg-none d-flex align-items-center gap-2"
              style={{ background: 'var(--eco-border)', border: 'none', height: 38, color: 'var(--eco-text-primary)', fontWeight: 700 }}
              onClick={() => setPublicMenuOpen((value) => !value)}
              aria-expanded={publicMenuOpen}
              aria-label="Ouvrir le menu public"
            >
              <i className={`bi ${publicMenuOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
              <span>Menu</span>
            </button>
            <div className="d-none d-md-flex gap-2">
              <Link to="/login" className="btn btn-sm btn-outline-secondary rounded-2">Connexion</Link>
              <Link to="/register" className="btn-eco btn btn-sm rounded-2">S'inscrire</Link>
            </div>
            </>
          )}
        </div>
      </div>

      {!isAuthenticated() && publicMenuOpen && (
        <div className="eco-mobile-public-menu d-lg-none">
          {publicLinks.map((item) => (
            <Link key={item.to} to={item.to} className="eco-mobile-public-link">
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="d-flex gap-2 pt-2">
            <Link to="/login" className="btn btn-sm btn-outline-secondary rounded-2 flex-fill">Connexion</Link>
            <Link to="/register" className="btn-eco btn btn-sm rounded-2 flex-fill">S'inscrire</Link>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
