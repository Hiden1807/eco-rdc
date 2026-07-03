// =============================================================
// src/pages/Settings.jsx — Page de configuration de l'application
// Gestion du thème + préférences de notification + accessibilité
// =============================================================
import React, { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

const Settings = () => {
  // Accès au contexte de thème global
  const { theme, changeTheme } = useTheme()
  // État des préférences de notification (simulé)
  const [notifs, setNotifs] = useState({
    signalements: true,
    urgences: true,
    newsletter: false,
    sms: false,
  })
  // Taille du texte sélectionnée
  const [fontSize, setFontSize] = useState('normale')
  // Message de sauvegarde
  const [saved, setSaved] = useState(false)

  // Initialisation de la taille de police
  useEffect(() => {
    const savedSize = localStorage.getItem('eco_font_size')
    if (savedSize) setFontSize(savedSize)
  }, [])

  // Appliquer la taille de police au changement
  useEffect(() => {
    if (fontSize === 'petite') {
      document.documentElement.style.fontSize = '14px'
    } else if (fontSize === 'grande') {
      document.documentElement.style.fontSize = '18px'
    } else {
      document.documentElement.style.fontSize = '16px'
    }
    localStorage.setItem('eco_font_size', fontSize)
  }, [fontSize])

  /**
   * handleSave — Simule la sauvegarde des paramètres
   */
  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000) // Cache le message après 3 secondes
  }

  // Options de thème avec descriptions
  const themeOptions = [
    {
      value: 'light',
      icon: 'bi-sun-fill',
      label: 'Mode Clair',
      desc: 'Interface lumineuse, adaptée pour les environnements bien éclairés.',
      color: '#f39c12',
      preview: 'linear-gradient(135deg, #f0f7f0, #fff)',
    },
    {
      value: 'dark',
      icon: 'bi-moon-fill',
      label: 'Mode Sombre',
      desc: 'Interface sombre, réduit la fatigue oculaire en environnement peu éclairé.',
      color: '#3498db',
      preview: 'linear-gradient(135deg, #0d1f0d, #1a2e1a)',
    },
    {
      value: 'system',
      icon: 'bi-circle-half',
      label: 'Thème Système',
      desc: 'Suit automatiquement la préférence de votre appareil (Windows/Android/iOS).',
      color: 'var(--eco-accent)',
      preview: 'linear-gradient(135deg, #0d1f0d 50%, #f0f7f0 50%)',
    },
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px' }}>

      <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--eco-text-primary)', marginBottom: 8 }}>
        <i className="bi bi-gear-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>
        Paramètres
      </h1>
      <p style={{ color: 'var(--eco-text-secondary)', marginBottom: 32, fontSize: '0.9rem' }}>
        Personnalisez votre expérience sur la plateforme EcoRDC Intelligence.
      </p>

      {/* ==================== SECTION THÈME ==================== */}
      <div className="eco-card p-4 mb-4">
        <div className="d-flex align-items-center gap-2 mb-4">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(243,156,18,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-palette-fill" style={{ color: '#f39c12', fontSize: '1rem' }}></i>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--eco-text-primary)', fontSize: '0.95rem' }}>Thème Visuel</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)' }}>Choisissez l'apparence de l'interface</div>
          </div>
        </div>

        {/* Grille de sélection des thèmes */}
        <div className="row g-3">
          {themeOptions.map((opt) => (
            <div key={opt.value} className="col-md-4">
              <div
                onClick={() => changeTheme(opt.value)}
                style={{
                  borderRadius: 14,
                  border: `2px solid ${theme === opt.value ? opt.color : 'var(--eco-border)'}`,
                  background: theme === opt.value ? `${opt.color}0d` : 'var(--eco-bg-primary)',
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                }}
              >
                {/* Prévisualisation du thème */}
                <div style={{
                  height: 56,
                  borderRadius: 8,
                  background: opt.preview,
                  marginBottom: 12,
                  border: '1px solid rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                }}>
                  {/* Simulacre d'interface miniature */}
                  <div style={{ padding: 6, display: 'flex', gap: 4 }}>
                    <div style={{ width: 40, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.3)' }}></div>
                    <div style={{ width: 20, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.15)' }}></div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className={`bi ${opt.icon}`} style={{ color: opt.color, fontSize: '1rem' }}></i>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--eco-text-primary)' }}>{opt.label}</span>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--eco-text-secondary)', margin: 0, lineHeight: 1.5 }}>{opt.desc}</p>

                {/* Indicateur de sélection */}
                {theme === opt.value && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 20, height: 20, borderRadius: '50%',
                    background: opt.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="bi bi-check-lg text-white" style={{ fontSize: '0.65rem' }}></i>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info sur le thème système */}
        {theme === 'system' && (
          <div className="mt-3 p-3 rounded-3 animate-fade-in" style={{ background: 'rgba(45,122,78,0.06)', border: '1px solid rgba(45,122,78,0.15)' }}>
            <i className="bi bi-info-circle-fill me-2" style={{ color: 'var(--eco-accent)', fontSize: '0.9rem' }}></i>
            <span style={{ fontSize: '0.8rem', color: 'var(--eco-text-secondary)' }}>
              Le thème système suivra automatiquement vos paramètres Android, iOS ou Windows.
              Actuellement: <strong style={{ color: 'var(--eco-accent)' }}>
                {window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Sombre' : 'Clair'}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* ==================== SECTION NOTIFICATIONS ==================== */}
      <div className="eco-card p-4 mb-4">
        <div className="d-flex align-items-center gap-2 mb-4">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(52,152,219,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-bell-fill" style={{ color: '#3498db', fontSize: '1rem' }}></i>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--eco-text-primary)', fontSize: '0.95rem' }}>Notifications</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)' }}>Gérez les alertes et communications</div>
          </div>
        </div>

        {/* Bascules de notification */}
        {[
          { key: 'signalements', label: 'Mises à jour de mes signalements', desc: 'Recevez une alerte quand le statut d\'un de vos signalements change.', icon: 'bi-collection-fill', color: '#27ae60' },
          { key: 'urgences', label: 'Alertes d\'urgence locales', desc: 'Soyez informé des incidents critiques dans votre commune.', icon: 'bi-exclamation-triangle-fill', color: '#e74c3c' },
          { key: 'newsletter', label: 'Newsletter hebdomadaire', desc: 'Recevez les statistiques et actualités éco de Kinshasa chaque semaine.', icon: 'bi-newspaper', color: '#f39c12' },
          { key: 'sms', label: 'Alertes SMS', desc: 'Recevez les alertes critiques par SMS sur votre téléphone.', icon: 'bi-chat-text-fill', color: '#8e44ad' },
        ].map((n) => (
          <div
            key={n.key}
            className="d-flex align-items-center justify-content-between py-3"
            style={{ borderBottom: '1px solid var(--eco-border)' }}
          >
            <div className="d-flex align-items-center gap-3">
              <i className={`bi ${n.icon}`} style={{ color: n.color, fontSize: '1.1rem', width: 24, textAlign: 'center' }}></i>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--eco-text-primary)' }}>{n.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--eco-text-secondary)', marginTop: 2 }}>{n.desc}</div>
              </div>
            </div>
            {/* Toggle switch HTML pur */}
            <button
              role="switch"
              aria-checked={notifs[n.key]}
              onClick={() => setNotifs((p) => ({ ...p, [n.key]: !p[n.key] }))}
              style={{
                width: 48, height: 26,
                borderRadius: 99,
                background: notifs[n.key] ? 'var(--eco-accent)' : 'var(--eco-border)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute',
                top: 3, left: notifs[n.key] ? 26 : 3,
                width: 20, height: 20,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
        ))}
      </div>

      {/* ==================== SECTION ACCESSIBILITÉ ==================== */}
      <div className="eco-card p-4 mb-4">
        <div className="d-flex align-items-center gap-2 mb-4">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(142,68,173,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-universal-access-circle" style={{ color: '#8e44ad', fontSize: '1rem' }}></i>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--eco-text-primary)', fontSize: '0.95rem' }}>Accessibilité</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)' }}>Adaptez l'interface à vos besoins</div>
          </div>
        </div>

        {/* Taille du texte */}
        <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--eco-text-primary)', marginBottom: 12, display: 'block' }}>
          Taille du texte
        </label>
        <div className="d-flex gap-2">
          {['petite', 'normale', 'grande'].map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className="btn btn-sm rounded-2 flex-fill"
              style={{
                border: `1.5px solid ${fontSize === size ? 'var(--eco-accent)' : 'var(--eco-border)'}`,
                background: fontSize === size ? 'rgba(45,122,78,0.08)' : 'var(--eco-bg-primary)',
                color: fontSize === size ? 'var(--eco-accent)' : 'var(--eco-text-secondary)',
                fontWeight: fontSize === size ? 700 : 400,
                padding: '9px',
                fontSize: size === 'petite' ? '0.75rem' : size === 'grande' ? '0.95rem' : '0.85rem',
                textTransform: 'capitalize',
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* ---- BOUTON DE SAUVEGARDE GLOBAL ---- */}
      <div className="d-flex align-items-center gap-3">
        <button
          id="btn-save-settings"
          onClick={handleSave}
          className="btn-eco btn rounded-3"
          style={{ padding: '13px 32px', fontSize: '0.95rem' }}
        >
          <i className="bi bi-check2-circle me-2"></i>Sauvegarder les paramètres
        </button>
        {saved && (
          <span className="animate-fade-in" style={{ color: '#27ae60', fontSize: '0.88rem', fontWeight: 600 }}>
            <i className="bi bi-check-circle-fill me-1"></i>Enregistré !
          </span>
        )}
      </div>
    </div>
  )
}

export default Settings
