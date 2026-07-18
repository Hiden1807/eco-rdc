// =============================================================
// src/pages/Home.jsx - Accueil public dynamique
// Les chiffres, actualites et contenus viennent du backend.
// =============================================================
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMapIncidents } from '../api/mapApi'
import { getCommunes } from '../api/signalementApi'
import { getPublications } from '../api/publicationApi'
import { getEducationContents } from '../api/educationApi'

const HomeLoadingScreen = () => (
  <main className="eco-home-loading" aria-live="polite" aria-busy="true">
    <div className="eco-home-loading__content">
      <img className="eco-home-loading__logo" src="/logo-eco-rdc.png" alt="Logo Eco-RDC" />
      <div className="eco-home-loading__title">EcoRDC Intelligence</div>
      <div className="eco-home-loading__subtitle">Chargement de l'accueil</div>
      <div className="eco-home-loading__dots" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </main>
)

const Home = () => {
  const { isAuthenticated, user } = useAuth()
  const [data, setData] = useState({
    incidents: [],
    communes: [],
    publications: [],
    education: [],
    loading: true,
  })

  useEffect(() => {
    Promise.all([
      getMapIncidents(),
      getCommunes(),
      getPublications({ status: 'published' }),
      getEducationContents(),
    ])
      .then(([incidents, communes, publications, education]) => {
        setData({ incidents, communes, publications, education, loading: false })
      })
      .catch((error) => {
        console.error('Impossible de charger l accueil public :', error)
        setData((current) => ({ ...current, loading: false }))
      })
  }, [])

  const dashboardPath = user?.role === 'citoyen'
    ? '/citizen-dashboard'
    : user?.role === 'autorite'
      ? '/authority-dashboard'
      : '/admin-dashboard'

  const resolvedCount = data.incidents.filter((item) => item.statut === 'resolu').length
  const criticalCount = data.incidents.filter((item) => item.gravite >= 4).length
  const featuredPublications = data.publications.slice(0, 3)
  const featuredEducation = data.education.slice(0, 3)
  const latestIncident = data.incidents[0]

  const stats = [
    { icon: 'bi-geo-alt-fill', label: 'Incidents geolocalises', value: data.incidents.length, color: '#e74c3c' },
    { icon: 'bi-check-circle-fill', label: 'Dossiers resolus', value: resolvedCount, color: '#27ae60' },
    { icon: 'bi-buildings-fill', label: 'Communes referencees', value: data.communes.length, color: '#3498db' },
    { icon: 'bi-exclamation-triangle-fill', label: 'Alertes critiques', value: criticalCount, color: '#f39c12' },
  ]

  if (data.loading) {
    return <HomeLoadingScreen />
  }

  return (
    <div>
      <section className="eco-hero d-flex align-items-center" style={{ minHeight: '92vh', paddingTop: 80 }}>
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-6 animate-fade-in-up">
              <div className="d-inline-flex align-items-center gap-2 mb-4 px-3 py-2 rounded-pill" style={{ background: 'rgba(76, 175, 128, 0.15)', border: '1px solid rgba(76, 175, 128, 0.3)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4caf80', display: 'inline-block' }}></span>
                <span style={{ fontSize: '0.82rem', color: '#4caf80', fontWeight: 600 }}>Plateforme environnementale publique</span>
              </div>

              <h1 style={{ fontSize: 'clamp(2.1rem, 5vw, 3.8rem)', fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
                ECO RDC Intelligence
              </h1>
              <p style={{ fontSize: '1.08rem', color: 'rgba(255,255,255,0.76)', lineHeight: 1.8, marginBottom: 32, maxWidth: 560 }}>
                Signalements citoyens, carte SIG, notifications institutionnelles, publications officielles et analyse predictive pour la gestion environnementale.
              </p>

              <div className="d-flex flex-wrap gap-3">
                {isAuthenticated() ? (
                  <Link to={dashboardPath} className="btn btn-lg rounded-3 fw-600" style={{ background: '#4caf80', color: '#fff', padding: '14px 28px', fontWeight: 700, boxShadow: '0 8px 25px rgba(76,175,128,0.32)' }}>
                    <i className="bi bi-speedometer2 me-2"></i>Mon espace
                  </Link>
                ) : (
                  <Link to="/register" className="btn btn-lg rounded-3 fw-600" style={{ background: '#4caf80', color: '#fff', padding: '14px 28px', fontWeight: 700, boxShadow: '0 8px 25px rgba(76,175,128,0.32)' }}>
                    <i className="bi bi-person-plus-fill me-2"></i>Creer un compte citoyen
                  </Link>
                )}
                <Link to="/map" className="btn btn-lg rounded-3" style={{ border: '2px solid rgba(76,175,128,0.5)', color: '#4caf80', padding: '14px 28px', background: 'transparent', fontWeight: 700 }}>
                  <i className="bi bi-map-fill me-2"></i>Consulter la carte
                </Link>
              </div>
            </div>

            <div className="col-lg-6 animate-fade-in-up delay-200">
              <div className="glass-card p-4">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #4caf80, #2d7a4e)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-shield-fill-check text-white fs-5"></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#111', fontSize: '1rem' }}>Etat public de la plateforme</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.55)' }}>{data.loading ? 'Chargement...' : 'Donnees issues du backend'}</div>
                  </div>
                </div>

                <div className="row g-3">
                  {stats.map((stat) => (
                    <div key={stat.label} className="col-6">
                      <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.35rem', color: stat.color, marginBottom: 8 }}>
                          <i className={`bi ${stat.icon}`}></i>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111', lineHeight: 1 }}>{stat.value}</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.58)', marginTop: 4 }}>{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-3 d-flex align-items-start gap-3" style={{ background: 'rgba(45,122,78,0.12)', border: '1px solid rgba(45,122,78,0.22)' }}>
                  <i className="bi bi-broadcast-pin mt-1" style={{ color: '#2d7a4e', fontSize: '1rem', flexShrink: 0 }}></i>
                  <div>
                    <div style={{ fontWeight: 700, color: '#2d7a4e', fontSize: '0.82rem' }}>Derniere activite</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(2,2,2,0.68)' }}>
                      {latestIncident ? `${latestIncident.titre} - ${latestIncident.commune || 'zone non precisee'}` : 'Aucune alerte publique geolocalisee pour le moment.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '72px 0', background: 'var(--eco-bg-primary)' }}>
        <div className="container">
          <div className="d-flex align-items-end justify-content-between gap-3 mb-4 flex-wrap">
            <div>
              <span className="badge mb-3 px-3 py-2 rounded-pill" style={{ background: 'rgba(45,122,78,0.12)', color: 'var(--eco-accent)', fontWeight: 700 }}>PUBLICATIONS</span>
              <h2 style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--eco-text-primary)', margin: 0 }}>Actualites et communiques</h2>
            </div>
            <Link to="/publications" className="btn btn-outline-success rounded-3"><i className="bi bi-megaphone-fill me-2"></i>Toutes les publications</Link>
          </div>

          <div className="row g-4">
            {data.loading && [0, 1, 2].map((item) => (
              <div className="col-md-4" key={`publication-skeleton-${item}`}>
                <article className="eco-card eco-publication-card p-0 h-100 overflow-hidden">
                  <div className="eco-skeleton" style={{ height: 150 }}></div>
                  <div className="p-4">
                    <div className="eco-skeleton mb-3" style={{ width: 86, height: 14 }}></div>
                    <div className="eco-skeleton mb-2" style={{ height: 20 }}></div>
                    <div className="eco-skeleton" style={{ height: 52 }}></div>
                  </div>
                </article>
              </div>
            ))}
            {!data.loading && featuredPublications.map((item, index) => (
              <div className="col-md-4" key={item.id}>
                <article className={`eco-card eco-publication-card p-0 h-100 overflow-hidden animate-fade-in-up delay-${Math.min((index + 1) * 100, 300)}`}>
                  {item.cover_image ? (
                    <img src={item.cover_image} alt={item.title} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                  ) : (
                    <div className="eco-publication-fallback">
                      <i className="bi bi-newspaper"></i>
                    </div>
                  )}
                  <div className="p-4">
                    <small style={{ color: 'var(--eco-accent)', fontWeight: 800, textTransform: 'uppercase' }}>{item.publication_type}</small>
                    <h3 style={{ fontSize: '1.08rem', fontWeight: 800, marginTop: 8 }}>{item.title}</h3>
                    <p style={{ color: 'var(--eco-text-secondary)' }}>{item.excerpt}</p>
                    <Link to={`/publications?publication=${item.id}`} className="btn btn-sm rounded-2" style={{ border: '1px solid var(--eco-border)', color: 'var(--eco-text-primary)', background: 'var(--eco-bg-primary)' }}>
                      Lire <i className="bi bi-arrow-right ms-1"></i>
                    </Link>
                  </div>
                </article>
              </div>
            ))}
            {!data.loading && !featuredPublications.length && <div className="eco-card p-5 text-center">Aucune publication officielle disponible pour le moment.</div>}
          </div>
        </div>
      </section>

      <section style={{ padding: '72px 0', background: 'var(--eco-bg-secondary)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <span className="badge mb-3 px-3 py-2 rounded-pill" style={{ background: 'rgba(45,122,78,0.12)', color: 'var(--eco-accent)', fontWeight: 700 }}>EDUCATION</span>
            <h2 style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--eco-text-primary)' }}>Contenus educatifs recents</h2>
          </div>
          <div className="row g-4">
            {featuredEducation.map((item) => (
              <div className="col-md-4" key={item.id}>
                <article className="eco-card h-100 p-4">
                  {item.image ? <img src={item.image} alt={item.title} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 14 }} /> : <i className="bi bi-book-fill" style={{ fontSize: '1.7rem', color: 'var(--eco-accent)' }}></i>}
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: 8 }}>{item.title}</h3>
                  <p style={{ color: 'var(--eco-text-secondary)' }}>{item.excerpt}</p>
                </article>
              </div>
            ))}
            {!featuredEducation.length && <div className="eco-card p-5 text-center">Aucun contenu educatif publie pour le moment.</div>}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
