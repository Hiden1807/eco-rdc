// =============================================================
// src/components/Loader.jsx — Composant d'animation de chargement
// Animation premium avec logo Eco RDC et spinner SVG
// =============================================================
import React from 'react'

/**
 * Loader — Affiche une superposition de chargement animée
 * @param {string} message - Message optionnel à afficher sous le spinner
 * @param {boolean} fullScreen - Si true, couvre tout l'écran (pour transitions)
 */
const Loader = ({ message = 'Chargement...', fullScreen = false }) => {
  // Style en ligne pour le conteneur du loader
  const containerStyle = fullScreen
    ? { position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--eco-overlay)' } // Plein écran
    : { padding: '40px 0' } // Centré dans un conteneur

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={containerStyle}
    >
      {/* Icône feuille animée — identité visuelle de l'application */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        {/* Cercle pulsant derrière l'icône */}
        <div
          className="animate-pulse-eco"
          style={{
            width: 72, height: 72,
            borderRadius: '50%',
            background: 'rgba(76, 175, 128, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Spinner SVG circulaire */}
          <svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            style={{ position: 'absolute', animation: 'spin 1.2s linear infinite' }}
          >
            <circle
              cx="36" cy="36" r="30"
              fill="none"
              stroke="var(--eco-accent)"
              strokeWidth="3"
              strokeDasharray="80 120"
              strokeLinecap="round"
            />
          </svg>
          {/* Icône de feuille au centre */}
          <i
            className="bi bi-leaf-fill"
            style={{ fontSize: '1.8rem', color: 'var(--eco-accent)', position: 'relative', zIndex: 1 }}
          ></i>
        </div>
      </div>

      {/* Nom de l'application */}
      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--eco-text-primary)', marginBottom: 4 }}>
        Eco RDC Intelligence
      </div>

      {/* Message de chargement dynamique */}
      <div style={{ fontSize: '0.85rem', color: 'var(--eco-text-secondary)' }}>
        {message}
      </div>
    </div>
  )
}

/**
 * InlineLoader — Petit spinner léger pour les boutons et sections
 * @param {string} size - 'sm' | 'md'
 */
export const InlineLoader = ({ size = 'md' }) => {
  const dim = size === 'sm' ? 20 : 32 // Taille du spinner en pixels
  return (
    <div
      style={{
        width: dim, height: dim,
        border: `3px solid rgba(76, 175, 128, 0.2)`,
        borderTopColor: 'var(--eco-accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block',
      }}
    />
  )
}

export default Loader
