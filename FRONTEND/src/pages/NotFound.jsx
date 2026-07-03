// =============================================================
// src/pages/NotFound.jsx — Page d'erreur 404 sur mesure
// Design: Illustration SVG animée + message d'humour kinois
// =============================================================
import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NotFound = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: 'var(--eco-bg-primary)',
        textAlign: 'center',
      }}
    >
      {/* ==================== ILLUSTRATION ANIMÉE ==================== */}
      <div className="animate-float mb-4">
        {/* SVG d'illustration 404 thématique écologie */}
        <svg width="220" height="180" viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Soleil */}
          <circle cx="170" cy="40" r="28" fill="rgba(243,156,18,0.15)" />
          <circle cx="170" cy="40" r="18" fill="rgba(243,156,18,0.4)" />
          {/* Nuage de pluie */}
          <ellipse cx="80" cy="60" rx="50" ry="30" fill="rgba(52,152,219,0.2)" />
          <ellipse cx="110" cy="55" rx="36" ry="22" fill="rgba(52,152,219,0.25)" />
          {/* Gouttes de pluie (inondation) */}
          {[65, 80, 95, 110, 125].map((x, i) => (
            <rect key={i} x={x} y={95 + i * 3} width={4} height={16} rx={2} fill="#3498db" opacity={0.5 + i * 0.1} />
          ))}
          {/* Terrain (colline érodée) */}
          <path d="M0 160 Q55 100 110 130 Q165 160 220 120 L220 180 L0 180 Z" fill="rgba(45,122,78,0.2)" />
          <path d="M0 170 Q55 140 110 155 Q165 170 220 145 L220 180 L0 180 Z" fill="rgba(45,122,78,0.35)" />
          {/* Petit arbre survivant */}
          <rect x="100" y="130" width="6" height="20" rx="2" fill="rgba(101,67,33,0.5)" />
          <circle cx="103" cy="124" r="14" fill="rgba(76,175,128,0.5)" />
          {/* Texte 404 intégré */}
          <text x="110" y="76" textAnchor="middle" fill="rgba(45,122,78,0.6)" fontSize="36" fontWeight="900" fontFamily="Inter, sans-serif">404</text>
        </svg>
      </div>

      {/* ==================== MESSAGE PRINCIPAL ==================== */}
      <h1
        style={{
          fontWeight: 900,
          fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
          color: 'var(--eco-text-primary)',
          marginBottom: 12,
          lineHeight: 1.2,
        }}
      >
        Oops ! Page Introuvable
      </h1>

      {/* Message d'humour avec contexte kinois */}
      <p style={{ color: 'var(--eco-text-secondary)', fontSize: '1rem', maxWidth: 420, lineHeight: 1.8, marginBottom: 8 }}>
        Cette page s'est perdue comme un déchet dans la rivière N'Djili... mais nous, on a trouvé une solution !
      </p>
      <p style={{ color: 'var(--eco-text-secondary)', fontSize: '0.88rem', maxWidth: 400, lineHeight: 1.7, marginBottom: 32, opacity: 0.7 }}>
        La page que vous cherchez n'existe pas ou a été déplacée. Utilisez les liens ci-dessous pour retrouver votre chemin.
      </p>

      {/* ==================== BOUTONS DE REDIRECTION ==================== */}
      <div className="d-flex flex-wrap gap-3 justify-content-center mb-5">
        <Link
          to="/"
          className="btn btn-lg rounded-3 d-flex align-items-center gap-2"
          style={{ background: 'var(--eco-accent-gradient)', color: '#fff', fontWeight: 700, padding: '13px 28px', boxShadow: '0 6px 20px rgba(45,122,78,0.3)' }}
        >
          <i className="bi bi-house-fill"></i> Accueil
        </Link>
        {isAuthenticated() && (
          <Link
            to={user?.role === 'autorite' ? '/authority-dashboard' : '/citizen-dashboard'}
            className="btn btn-lg rounded-3 d-flex align-items-center gap-2"
            style={{ border: '2px solid var(--eco-accent)', color: 'var(--eco-accent)', fontWeight: 700, padding: '13px 28px', background: 'transparent' }}
          >
            <i className="bi bi-speedometer2"></i> Mon Tableau de Bord
          </Link>
        )}
        <Link
          to="/map"
          className="btn btn-lg rounded-3 d-flex align-items-center gap-2"
          style={{ border: '2px solid var(--eco-border)', color: 'var(--eco-text-secondary)', fontWeight: 600, padding: '13px 28px', background: 'transparent' }}
        >
          <i className="bi bi-map-fill"></i> Carte SIG
        </Link>
      </div>

      {/* ==================== LIENS RAPIDES ==================== */}
      <div
        style={{
          background: 'var(--eco-bg-card)',
          border: '1px solid var(--eco-border)',
          borderRadius: 16,
          padding: '24px',
          maxWidth: 460,
          width: '100%',
        }}
      >
        <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--eco-text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Pages populaires
        </p>
        <div className="d-flex flex-column gap-2">
          {[
            { to: '/signalements/new', icon: 'bi-plus-circle-fill', label: 'Signaler un incident écologique', color: '#27ae60' },
            { to: '/statistics', icon: 'bi-bar-chart-fill', label: 'Statistiques de Kinshasa', color: '#3498db' },
            { to: '/education', icon: 'bi-book-fill', label: 'Guides et éco-gestes', color: '#8e44ad' },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-decoration-none d-flex align-items-center gap-3 p-3 rounded-3"
              style={{ background: 'var(--eco-bg-primary)', border: '1px solid var(--eco-border)', color: 'var(--eco-text-primary)', transition: 'all 0.2s ease' }}
            >
              <i className={`bi ${link.icon}`} style={{ color: link.color, fontSize: '1.1rem', width: 20, textAlign: 'center' }}></i>
              <span style={{ fontWeight: 500, fontSize: '0.88rem', flex: 1 }}>{link.label}</span>
              <i className="bi bi-chevron-right" style={{ color: 'var(--eco-text-secondary)', fontSize: '0.75rem' }}></i>
            </Link>
          ))}
        </div>
      </div>

      {/* Code d'erreur */}
      <div style={{ marginTop: 32, fontSize: '0.72rem', color: 'var(--eco-text-secondary)', opacity: 0.5 }}>
        Erreur 404 — EcoRDC Intelligence v1.0 — Kinshasa, RDC
      </div>
    </div>
  )
}

export default NotFound
