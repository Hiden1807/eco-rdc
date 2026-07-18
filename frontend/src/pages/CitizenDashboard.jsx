// =============================================================
// src/pages/CitizenDashboard.jsx - Tableau de bord citoyen
// Toutes les donnees proviennent des endpoints dashboard/signalements.
// =============================================================
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getStatsCitoyen } from '../api/dashboardApi'
import Loader from '../components/Loader'

const STATUT_CONFIG = {
  nouveau: { label: 'Nouveau', color: '#3498db', bg: 'rgba(52,152,219,0.12)', icon: 'bi-clock-fill' },
  valide: { label: 'Valide', color: '#16a085', bg: 'rgba(22,160,133,0.12)', icon: 'bi-patch-check-fill' },
  en_traitement: { label: 'En traitement', color: '#e67e22', bg: 'rgba(230,126,34,0.12)', icon: 'bi-arrow-repeat' },
  resolu: { label: 'Resolu', color: '#27ae60', bg: 'rgba(39,174,96,0.12)', icon: 'bi-check-circle-fill' },
  rejete: { label: 'Rejete', color: '#e74c3c', bg: 'rgba(231,76,60,0.12)', icon: 'bi-x-circle-fill' },
}

function iconForType(type = '') {
  if (type.includes('inond')) return { icon: 'bi-water', color: '#2980b9' }
  if (type.includes('erosion')) return { icon: 'bi-exclamation-triangle-fill', color: '#c0392b' }
  if (type.includes('pollution')) return { icon: 'bi-droplet-half', color: '#8e44ad' }
  if (type.includes('caniveau')) return { icon: 'bi-cone-striped', color: '#e67e22' }
  if (type.includes('air') || type.includes('brul')) return { icon: 'bi-fire', color: '#e74c3c' }
  return { icon: 'bi-trash3-fill', color: '#7f8c8d' }
}

const CitizenDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(await getStatsCitoyen())
      } catch (error) {
        console.error('Erreur chargement stats citoyen :', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <Loader message="Chargement de votre tableau de bord..." />

  const statCards = [
    { label: 'Total signalements', value: stats?.totalSignalements || 0, icon: 'bi-collection-fill', color: '#3498db', bg: 'rgba(52,152,219,0.1)' },
    { label: 'Problemes resolus', value: stats?.resolus || 0, icon: 'bi-check-circle-fill', color: '#27ae60', bg: 'rgba(39,174,96,0.1)' },
    { label: 'En traitement', value: stats?.enCours || 0, icon: 'bi-arrow-repeat', color: '#e67e22', bg: 'rgba(230,126,34,0.1)' },
    { label: 'Points eco', value: stats?.pointsEco || 0, icon: 'bi-star-fill', color: '#f39c12', bg: 'rgba(243,156,18,0.1)' },
  ]

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <section
        className="p-4 mb-5 animate-fade-in"
        style={{
          background: 'var(--eco-accent-gradient)',
          borderRadius: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', marginBottom: 4 }}>
              Espace citoyen
            </div>
            <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.45rem', margin: 0 }}>
              {user?.name || 'Citoyen ECO RDC'}
            </h1>
            <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
              <span style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', padding: '4px 12px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 600 }}>
                <i className="bi bi-award-fill me-1"></i>{stats?.rang || 'Eco-Citoyen'}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', padding: '4px 12px', borderRadius: 99, fontSize: '0.78rem' }}>
                <i className="bi bi-geo-alt-fill me-1"></i>{user?.commune || 'Commune non definie'}
              </span>
            </div>
          </div>

          <Link
            to="/signalements/new"
            className="btn btn-lg rounded-3 d-flex align-items-center gap-2"
            style={{ background: '#fff', color: 'var(--eco-accent)', fontWeight: 700, padding: '12px 22px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            <i className="bi bi-plus-circle-fill"></i>
            Nouveau signalement
          </Link>
        </div>
      </section>

      <section className="row g-3 mb-5">
        {statCards.map((card) => (
          <div key={card.label} className="col-6 col-md-3">
            <div className="stat-card h-100">
              <div className="stat-icon mb-3" style={{ background: card.bg, color: card.color }}>
                <i className={`bi ${card.icon}`}></i>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--eco-text-primary)', lineHeight: 1 }}>
                {card.value}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--eco-text-secondary)', marginTop: 6 }}>
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="row g-4">
        <div className="col-lg-8">
          <section className="eco-card p-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h2 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0, color: 'var(--eco-text-primary)' }}>
                <i className="bi bi-clock-history me-2" style={{ color: 'var(--eco-accent)' }}></i>
                Signalements recents
              </h2>
              <Link to="/signalements" style={{ fontSize: '0.82rem', color: 'var(--eco-accent)', textDecoration: 'none', fontWeight: 600 }}>
                Voir tout <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>

            <div className="timeline">
              {(stats?.timeline || []).length === 0 && (
                <div style={{ color: 'var(--eco-text-secondary)', fontSize: '0.9rem', padding: '12px 0' }}>
                  Aucun signalement pour le moment.
                </div>
              )}

              {(stats?.timeline || []).map((item) => {
                const statut = STATUT_CONFIG[item.statut] || STATUT_CONFIG.nouveau
                const typeIcon = iconForType(item.type)
                return (
                  <div key={item.id} className="timeline-item">
                    <div className="timeline-dot" style={{ background: statut.color }}>
                      <i className={`bi ${statut.icon}`} style={{ fontSize: '0.55rem' }}></i>
                    </div>
                    <Link
                      to={`/signalements/${item.id}`}
                      className="text-decoration-none"
                      style={{
                        display: 'block',
                        background: 'var(--eco-bg-primary)',
                        borderRadius: 8,
                        padding: '14px 16px',
                        border: '1px solid var(--eco-border)',
                      }}
                    >
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <div className="d-flex align-items-center gap-3">
                          <span style={{ width: 34, height: 34, borderRadius: 8, background: `${typeIcon.color}18`, color: typeIcon.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className={`bi ${typeIcon.icon}`}></i>
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--eco-text-primary)', marginBottom: 2 }}>
                              {item.titre}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)' }}>
                              <i className="bi bi-calendar3 me-1"></i>
                              {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <span style={{ background: statut.bg, color: statut.color, padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {statut.label}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div style={{ fontSize: '0.7rem', color: 'var(--eco-text-secondary)', marginBottom: 4 }}>
                          Gravite: {item.gravite}/5
                        </div>
                        <div className="eco-progress" style={{ height: 4 }}>
                          <div className="eco-progress-bar" style={{ width: `${item.gravite * 20}%`, background: item.gravite >= 4 ? '#e74c3c' : item.gravite >= 3 ? '#e67e22' : '#27ae60' }} />
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <div className="col-lg-4">
          <section className="eco-card p-4 mb-4">
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--eco-text-primary)', marginBottom: 16 }}>
              <i className="bi bi-award-fill me-2" style={{ color: '#f39c12' }}></i>
              Progression citoyenne
            </h3>
            <div className="text-center mb-4">
              <div style={{ width: 64, height: 64, margin: '0 auto 10px', borderRadius: 12, background: 'rgba(243,156,18,0.14)', color: '#f39c12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                <i className="bi bi-award-fill"></i>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--eco-text-primary)' }}>{stats?.rang || 'Eco-Citoyen'}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--eco-text-secondary)' }}>{stats?.pointsEco || 0} points</div>
            </div>
            <div className="eco-progress">
              <div className="eco-progress-bar" style={{ width: `${Math.min(100, ((stats?.pointsEco || 0) / 500) * 100)}%` }} />
            </div>
          </section>

          <section className="eco-card p-4">
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--eco-text-primary)', marginBottom: 16 }}>
              <i className="bi bi-lightning-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>
              Actions rapides
            </h3>
            <div className="d-flex flex-column gap-2">
              {[
                { to: '/signalements/new', icon: 'bi-plus-circle-fill', label: 'Signaler un incident', color: '#27ae60' },
                { to: '/map', icon: 'bi-map-fill', label: 'Voir la carte SIG', color: '#2980b9' },
                { to: '/education', icon: 'bi-book-fill', label: 'Consulter les contenus educatifs', color: '#8e44ad' },
                { to: '/statistics', icon: 'bi-bar-chart-fill', label: 'Consulter les statistiques', color: '#e67e22' },
              ].map((action) => (
                <Link key={action.to} to={action.to} className="text-decoration-none d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'var(--eco-bg-primary)', border: '1px solid var(--eco-border)', color: 'var(--eco-text-primary)' }}>
                  <span style={{ width: 34, height: 34, borderRadius: 8, background: `${action.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`bi ${action.icon}`} style={{ color: action.color }}></i>
                  </span>
                  <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>{action.label}</span>
                  <i className="bi bi-chevron-right ms-auto" style={{ color: 'var(--eco-text-secondary)', fontSize: '0.75rem' }}></i>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default CitizenDashboard
