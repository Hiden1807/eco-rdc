// =============================================================
// src/layouts/PublicLayout.jsx — Mise en page pour visiteurs anonymes
// Structure propre avec Navbar + contenu + footer
// =============================================================
import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

/**
 * PublicLayout — Disposition standard pour les pages publiques (accueil, login, etc.)
 * <Outlet /> est remplacé par le composant de la route active (React Router)
 */
const PublicLayout = () => {
  return (
    // Conteneur principal prenant toute la hauteur de la page
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Barre de navigation supérieure (sans hamburger car pas de sidebar) */}
      <Navbar />

      {/* Zone de contenu principale — Outlet injecte la page active */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer
        style={{
          background: 'var(--eco-sidebar-bg)',
          color: 'var(--eco-sidebar-text)',
          padding: '40px 0 20px',
          marginTop: 'auto',
        }}
      >
        <div className="container">
          <div className="row g-4">
            {/* Colonne 1: À propos */}
            <div className="col-md-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <img
                  src="/logo-eco-rdc.png"
                  alt="Logo Eco-RDC"
                  style={{
                    width: 40, height: 40,
                    objectFit: 'contain',
                  }}
                />
                <span style={{ fontWeight: 700, color: '#fff' }}>EcoRDC Intelligence</span>
              </div>
              <p style={{ fontSize: '0.85rem', opacity: 0.7, lineHeight: 1.7 }}>
                Plateforme citoyenne d'intelligence écologique pour une Kinshasa plus propre, plus résiliente et plus verte.
              </p>
            </div>
            {/* Colonne 2: Liens rapides */}
            <div className="col-md-4">
              <h6 style={{ color: '#fff', fontWeight: 600, marginBottom: 12 }}>Liens Rapides</h6>
              <ul className="list-unstyled" style={{ fontSize: '0.85rem' }}>
                <li className="mb-1"><a href="/map" style={{ color: 'var(--eco-sidebar-text)', textDecoration: 'none', opacity: 0.8 }}>🗺️ Carte Écologique</a></li>
                <li className="mb-1"><a href="/education" style={{ color: 'var(--eco-sidebar-text)', textDecoration: 'none', opacity: 0.8 }}>📚 Guides Éco</a></li>
                <li className="mb-1"><a href="/statistics" style={{ color: 'var(--eco-sidebar-text)', textDecoration: 'none', opacity: 0.8 }}>📊 Statistiques</a></li>
                <li className="mb-1"><a href="/register" style={{ color: 'var(--eco-sidebar-text)', textDecoration: 'none', opacity: 0.8 }}>🌱 Rejoindre la communauté</a></li>
              </ul>
            </div>
            {/* Colonne 3: Contact */}
            <div className="col-md-4">
              <h6 style={{ color: '#fff', fontWeight: 600, marginBottom: 12 }}>Contact</h6>
              <ul className="list-unstyled" style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                <li className="mb-2"><i className="bi bi-envelope-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>info@ecordc.cd</li>
                <li className="mb-2"><i className="bi bi-telephone-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>+243 81 000 0000</li>
                <li className="mb-2"><i className="bi bi-geo-alt-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>Mairie de Kinshasa, Gombe</li>
              </ul>
            </div>
          </div>
          {/* Copyright */}
          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '20px 0 12px' }} />
          <div style={{ textAlign: 'center', fontSize: '0.78rem', opacity: 0.5 }}>
            © 2024 EcoRDC Intelligence — Ville de Kinshasa | Tous droits réservés
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
