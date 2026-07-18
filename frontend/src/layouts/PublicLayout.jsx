// =============================================================
// src/layouts/PublicLayout.jsx - Layout des pages publiques
// Header, contenu et footer institutionnel.
// =============================================================
import React, { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import AIAssistantWidget from '../components/AIAssistantWidget'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'

const PublicLayout = () => {
  const { isAuthenticated } = useAuth()
  const connected = isAuthenticated()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false))

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((previous) => !previous)
    } else {
      setSidebarCollapsed((previous) => !previous)
    }
  }

  const content = (
    <>
      <Navbar
        onToggleSidebar={connected ? toggleSidebar : undefined}
        sidebarCollapsed={connected && !isMobile ? sidebarCollapsed : false}
      />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{ background: 'var(--eco-sidebar-bg)', color: 'var(--eco-sidebar-text)', padding: '42px 0 20px', marginTop: 'auto' }}>
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <img src="/logo-eco-rdc.png" alt="Logo Eco-RDC" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                <span style={{ fontWeight: 800, color: '#fff' }}>EcoRDC Intelligence</span>
              </div>
              <p style={{ fontSize: '0.85rem', opacity: 0.76, lineHeight: 1.7 }}>
                Plateforme nationale de signalement, education, cartographie et aide a la decision environnementale.
              </p>
            </div>
            <div className="col-md-4">
              <h2 style={{ color: '#fff', fontWeight: 700, marginBottom: 12, fontSize: '0.95rem' }}>Services publics</h2>
              <ul className="list-unstyled" style={{ fontSize: '0.85rem' }}>
                <li className="mb-2"><Link to="/map" style={{ color: 'var(--eco-sidebar-text)', textDecoration: 'none', opacity: 0.84 }}><i className="bi bi-map-fill me-2"></i>Carte SIG</Link></li>
                <li className="mb-2"><Link to="/education" style={{ color: 'var(--eco-sidebar-text)', textDecoration: 'none', opacity: 0.84 }}><i className="bi bi-book-fill me-2"></i>Education environnementale</Link></li>
                <li className="mb-2"><Link to="/statistics" style={{ color: 'var(--eco-sidebar-text)', textDecoration: 'none', opacity: 0.84 }}><i className="bi bi-bar-chart-fill me-2"></i>Statistiques publiques</Link></li>
                <li className="mb-2"><Link to="/publications" style={{ color: 'var(--eco-sidebar-text)', textDecoration: 'none', opacity: 0.84 }}><i className="bi bi-megaphone-fill me-2"></i>Publications officielles</Link></li>
              </ul>
            </div>
            <div className="col-md-4">
              <h2 style={{ color: '#fff', fontWeight: 700, marginBottom: 12, fontSize: '0.95rem' }}>Coordination</h2>
              <ul className="list-unstyled" style={{ fontSize: '0.85rem', opacity: 0.84 }}>
                <li className="mb-2"><i className="bi bi-envelope-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>contact@ecordc.cd</li>
                <li className="mb-2"><i className="bi bi-shield-check me-2" style={{ color: 'var(--eco-accent)' }}></i>Acces institutionnel securise</li>
                <li className="mb-2"><i className="bi bi-geo-alt-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>Republique Democratique du Congo</li>
              </ul>
            </div>
          </div>
          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '22px 0 12px' }} />
          <div style={{ textAlign: 'center', fontSize: '0.78rem', opacity: 0.58 }}>
            © 2026 EcoRDC Intelligence - Plateforme environnementale.
          </div>
        </div>
      </footer>
    </>
  )

  if (connected) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--eco-bg-primary)' }}>
        <Sidebar
          collapsed={isMobile ? false : sidebarCollapsed}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <div
          className={`eco-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          {content}
          <AIAssistantWidget />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {content}
    </div>
  )
}

export default PublicLayout
