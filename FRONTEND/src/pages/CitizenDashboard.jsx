// =============================================================
// src/pages/CitizenDashboard.jsx — Tableau de bord du citoyen
// Design: Cartes de stats + Timeline dynamique des signalements
// =============================================================
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getStatsCitoyen } from '../api/dashboardApi'
import Loader from '../components/Loader'

// Mapping des statuts vers des étiquettes et couleurs lisibles
const STATUT_CONFIG = {
  nouveau:       { label: 'Nouveau', color: '#3498db', bg: 'rgba(52,152,219,0.12)', icon: 'bi-clock-fill' },
  en_traitement: { label: 'En Traitement', color: '#e67e22', bg: 'rgba(230,126,34,0.12)', icon: 'bi-arrow-repeat' },
  resolu:        { label: 'Résolu', color: '#27ae60', bg: 'rgba(39,174,96,0.12)', icon: 'bi-check-circle-fill' },
  rejete:        { label: 'Rejeté', color: '#e74c3c', bg: 'rgba(231,76,60,0.12)', icon: 'bi-x-circle-fill' },
}

// Mapping des types d'incidents vers des émojis
const TYPE_ICONS = {
  inondation:   { emoji: '🌊', color: '#2980b9' },
  depot_sauvage:{ emoji: '🗑️', color: '#e67e22' },
  erosion:      { emoji: '⛰️', color: '#c0392b' },
  brulage:      { emoji: '🔥', color: '#e74c3c' },
  pollution:    { emoji: '☣️', color: '#8e44ad' },
}

/**
 * CitizenDashboard — Tableau de bord personnel du citoyen connecté
 */
const CitizenDashboard = () => {
  // Récupère les données de l'utilisateur connecté
  const { user } = useAuth()

  // État des statistiques du citoyen (null tant que non chargées)
  const [stats, setStats] = useState(null)
  // État de chargement des données
  const [loading, setLoading] = useState(true)

  // Effet : charge les statistiques au montage du composant
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Appel à l'API avec l'ID de l'utilisateur connecté
        const data = await getStatsCitoyen(user?.id)
        setStats(data)
      } catch (e) {
        console.error('Erreur chargement stats:', e)
      } finally {
        setLoading(false) // Désactive le loader dans tous les cas
      }
    }
    fetchStats()
  }, [user?.id]) // Se déclenche si l'ID utilisateur change

  // Affiche le loader pendant le chargement
  if (loading) return <Loader message="Chargement de votre tableau de bord..." />

  // Cartes de statistiques résumées
  const statCards = [
    { label: 'Total Signalements', value: stats?.totalSignalements, icon: 'bi-collection-fill', color: '#3498db', bg: 'rgba(52,152,219,0.1)' },
    { label: 'Problèmes Résolus', value: stats?.resolus, icon: 'bi-check-circle-fill', color: '#27ae60', bg: 'rgba(39,174,96,0.1)' },
    { label: 'En Cours de Traitement', value: stats?.enCours, icon: 'bi-arrow-repeat', color: '#e67e22', bg: 'rgba(230,126,34,0.1)' },
    { label: 'Points Éco Gagnés', value: stats?.pointsEco, icon: 'bi-star-fill', color: '#f39c12', bg: 'rgba(243,156,18,0.1)' },
  ]

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ==================== EN-TÊTE PERSONNALISÉ ==================== */}
      <div
        className="rounded-4 p-4 mb-5 animate-fade-in"
        style={{
          background: 'var(--eco-accent-gradient)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Cercle décoratif */}
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -80, right: -60 }}></div>

        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            {/* Salutation personnalisée */}
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: 4 }}>
              Bienvenue sur votre espace,
            </div>
            <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.6rem', margin: 0 }}>
              {user?.name} 👋
            </h1>
            {/* Badge de rang gamifié */}
            <div className="d-flex align-items-center gap-2 mt-2">
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '4px 12px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 600 }}>
                ⭐ {stats?.rang}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '4px 12px', borderRadius: 99, fontSize: '0.78rem' }}>
                📍 {user?.commune}
              </span>
            </div>
          </div>
          {/* Bouton principal d'action */}
          <Link
            to="/signalements/new"
            className="btn btn-lg rounded-3 d-flex align-items-center gap-2"
            style={{ background: '#fff', color: 'var(--eco-accent)', fontWeight: 700, padding: '12px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            <i className="bi bi-plus-circle-fill"></i>
            Nouveau Signalement
          </Link>
        </div>
      </div>

      {/* ==================== CARTES DE STATISTIQUES ==================== */}
      <div className="row g-3 mb-5">
        {statCards.map((card, i) => (
          <div key={i} className={`col-6 col-md-3 animate-fade-in-up delay-${i * 100}`}>
            <div className="stat-card h-100">
              {/* Icône de la stat */}
              <div className="stat-icon mb-3" style={{ background: card.bg, color: card.color }}>
                <i className={`bi ${card.icon}`}></i>
              </div>
              {/* Valeur numérique */}
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--eco-text-primary)', lineHeight: 1 }}>
                {card.value}
              </div>
              {/* Label */}
              <div style={{ fontSize: '0.78rem', color: 'var(--eco-text-secondary)', marginTop: 6 }}>
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== SECTION TIMELINE + BARRE LATÉRALE ==================== */}
      <div className="row g-4">

        {/* ---- TIMELINE DES SIGNALEMENTS ---- */}
        <div className="col-lg-8">
          <div className="eco-card p-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0, color: 'var(--eco-text-primary)' }}>
                <i className="bi bi-clock-history me-2" style={{ color: 'var(--eco-accent)' }}></i>
                Mes Signalements Récents
              </h3>
              <Link to="/signalements" style={{ fontSize: '0.82rem', color: 'var(--eco-accent)', textDecoration: 'none', fontWeight: 600 }}>
                Voir tout <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>

            {/* Boucle sur les éléments de la timeline */}
            <div className="timeline">
              {stats?.timeline?.map((item, i) => {
                const statut = STATUT_CONFIG[item.statut] || STATUT_CONFIG.nouveau
                const typeIcon = TYPE_ICONS[item.type] || { emoji: '📍', color: '#7f8c8d' }

                return (
                  <div key={item.id} className={`timeline-item animate-fade-in-up delay-${i * 100}`}>
                    {/* Point de la timeline coloré selon le statut */}
                    <div className="timeline-dot" style={{ background: statut.color }}>
                      <i className={`bi ${statut.icon}`} style={{ fontSize: '0.55rem' }}></i>
                    </div>

                    {/* Carte de l'incident dans la timeline */}
                    <Link
                      to={`/signalements/${item.id}`}
                      className="text-decoration-none"
                      style={{
                        display: 'block',
                        background: 'var(--eco-bg-primary)',
                        borderRadius: 12,
                        padding: '14px 16px',
                        border: '1px solid var(--eco-border)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* Émoji du type d'incident */}
                          <span style={{ fontSize: '1.4rem' }}>{typeIcon.emoji}</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--eco-text-primary)', marginBottom: 2 }}>
                              {item.titre}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)' }}>
                              📅 {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        {/* Badge de statut */}
                        <span
                          style={{
                            background: statut.bg,
                            color: statut.color,
                            padding: '3px 10px',
                            borderRadius: 99,
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {statut.label}
                        </span>
                      </div>

                      {/* Barre de gravité */}
                      <div className="mt-2">
                        <div style={{ fontSize: '0.7rem', color: 'var(--eco-text-secondary)', marginBottom: 4 }}>
                          Gravité: {item.gravite}/5
                        </div>
                        <div className="eco-progress" style={{ height: 4 }}>
                          <div
                            className="eco-progress-bar"
                            style={{
                              width: `${item.gravite * 20}%`,
                              background: item.gravite >= 4 ? '#e74c3c' : item.gravite >= 3 ? '#e67e22' : '#27ae60',
                            }}
                          />
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ---- PANNEAU LATÉRAL DROIT ---- */}
        <div className="col-lg-4">

          {/* Carte de progression Éco */}
          <div className="eco-card p-4 mb-4">
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--eco-text-primary)', marginBottom: 16 }}>
              <i className="bi bi-star-fill me-2" style={{ color: '#f39c12' }}></i>
              Ma Progression Éco
            </h4>
            {/* Niveau actuel */}
            <div className="text-center mb-4">
              <div style={{ fontSize: '3rem', marginBottom: 4 }}>🥉</div>
              <div style={{ fontWeight: 700, color: 'var(--eco-text-primary)' }}>{stats?.rang}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--eco-text-secondary)' }}>{stats?.pointsEco} points</div>
            </div>
            {/* Progression vers le niveau suivant */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>Prochain niveau: Argent</span>
                <span>{stats?.pointsEco}/500</span>
              </div>
              <div className="eco-progress">
                <div className="eco-progress-bar" style={{ width: `${(stats?.pointsEco / 500) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="eco-card p-4">
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--eco-text-primary)', marginBottom: 16 }}>
              <i className="bi bi-lightning-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>
              Actions Rapides
            </h4>
            <div className="d-flex flex-column gap-2">
              {/* Liens vers les fonctionnalités clés */}
              {[
                { to: '/signalements/new', icon: 'bi-plus-circle-fill', label: 'Signaler un incident', color: '#27ae60' },
                { to: '/map', icon: 'bi-map-fill', label: 'Voir la carte Kinshasa', color: '#2980b9' },
                { to: '/education', icon: 'bi-book-fill', label: 'Guides écologiques', color: '#8e44ad' },
                { to: '/statistics', icon: 'bi-bar-chart-fill', label: 'Consulter les stats', color: '#e67e22' },
              ].map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="text-decoration-none d-flex align-items-center gap-3 p-3 rounded-3"
                  style={{ background: 'var(--eco-bg-primary)', border: '1px solid var(--eco-border)', transition: 'all 0.2s ease', color: 'var(--eco-text-primary)' }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${action.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`bi ${action.icon}`} style={{ color: action.color, fontSize: '1rem' }}></i>
                  </div>
                  <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>{action.label}</span>
                  <i className="bi bi-chevron-right ms-auto" style={{ color: 'var(--eco-text-secondary)', fontSize: '0.75rem' }}></i>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CitizenDashboard
