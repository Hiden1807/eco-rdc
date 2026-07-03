// =============================================================
// src/pages/Home.jsx — Page d'accueil publique
// Hero immersif + statistiques animées + éco-gestes
// Design: Full-screen hero avec glassmorphisme
// =============================================================
import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * CountUpNumber — Anime un nombre de 0 à sa valeur finale
 * @param {number} target - La valeur cible
 * @param {string} suffix - Suffixe optionnel (ex: '+', '%')
 */
const CountUpNumber = ({ target, suffix = '', prefix = '' }) => {
  // État du chiffre affiché pendant l'animation
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    // Utilise IntersectionObserver pour démarrer l'animation quand l'élément est visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 2000 // Durée de l'animation en ms
          const steps = 60
          const increment = target / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              setCount(target)
              clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

/**
 * Home — Page d'accueil publique de la plateforme EcoRDC
 */
const Home = () => {
  // Accès à l'état d'authentification pour adapter les boutons d'action
  const { isAuthenticated, user } = useAuth()

  // Données des statistiques globales de Kinshasa (mock réalistes)
  const stats = [
    { icon: 'bi-geo-alt-fill', label: 'Incidents Signalés', value: 487, suffix: '+', color: '#e74c3c' },
    { icon: 'bi-check-circle-fill', label: 'Problèmes Résolus', value: 312, suffix: '+', color: '#27ae60' },
    { icon: 'bi-people-fill', label: 'Éco-Citoyens Actifs', value: 2841, suffix: '+', color: '#3498db' },
    { icon: 'bi-buildings-fill', label: 'Communes Couvertes', value: 24, suffix: '', color: '#f39c12' },
  ]

  // Données des éco-gestes recommandés
  const ecoGestes = [
    {
      icon: 'bi-recycle',
      titre: 'Trier ses Déchets',
      desc: 'Séparez plastiques, organiques et papiers. Les bacs verts de l\'OPE Kinshasa sont disponibles dans chaque commune.',
      color: '#27ae60',
    },
    {
      icon: 'bi-droplet-fill',
      titre: 'Protéger les Rivières',
      desc: 'Évitez de jeter des déchets près des rivières N\'Djili, Funa et Kalamu. Elles alimentent des milliers de foyers.',
      color: '#2980b9',
    },
    {
      icon: 'bi-tree-fill',
      titre: 'Planter des Arbres',
      desc: 'Un arbre planté consolide les collines et prévient l\'érosion. Les pépinières communales offrent des plants gratuits.',
      color: '#16a085',
    },
    {
      icon: 'bi-phone-fill',
      titre: 'Signaler les Incidents',
      desc: 'Utilisez cette plateforme pour signaler inondations, dépôts sauvages et érosions. Chaque signalement compte.',
      color: '#8e44ad',
    },
  ]

  // Données des communes et leur niveau de risque écologique
  const communesRisques = [
    { name: 'Masina', risque: 92, incidents: 38 },
    { name: 'Ndjili', risque: 87, incidents: 54 },
    { name: 'Kimbanseke', risque: 81, incidents: 33 },
    { name: 'Ngaliema', risque: 65, incidents: 65 },
    { name: 'Lemba', risque: 42, incidents: 29 },
    { name: 'Gombe', risque: 35, incidents: 87 },
  ]

  return (
    <div>
      {/* ==================== SECTION HERO ==================== */}
      <section className="eco-hero d-flex align-items-center" style={{ minHeight: '100vh', paddingTop: 80 }}>
        <div className="container py-5">
          <div className="row align-items-center g-5">

            {/* Colonne gauche: texte et appels à l'action */}
            <div className="col-lg-6 animate-fade-in-up">
              {/* Badge de localisation */}
              <div
                className="d-inline-flex align-items-center gap-2 mb-4 px-3 py-2 rounded-pill"
                style={{ background: 'rgba(76, 175, 128, 0.15)', border: '1px solid rgba(76, 175, 128, 0.3)' }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4caf80', display: 'inline-block', animation: 'pulse-eco 2s infinite' }}></span>
                <span style={{ fontSize: '0.82rem', color: '#4caf80', fontWeight: 500 }}>🇨🇩 Kinshasa, République Démocratique du Congo</span>
              </div>

              {/* Titre principal */}
              <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
                Gardons{' '}
                <span style={{ color: '#4caf80' }}>Kinshasa</span>
                <br />Propre & Résiliente
              </h1>

              {/* Sous-titre descriptif */}
              <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 32, maxWidth: 520 }}>
                Signalez les incidents écologiques, suivez leur résolution en temps réel et rejoignez les <strong style={{ color: '#4caf80' }}>2 841</strong> citoyens
                qui construisent une ville plus verte.
              </p>

              {/* Boutons d'action principaux */}
              <div className="d-flex flex-wrap gap-3">
                {isAuthenticated() ? (
                  // Si connecté: rediriger vers le tableau de bord approprié
                  <Link
                    to={user?.role === 'autorite' ? '/authority-dashboard' : '/citizen-dashboard'}
                    className="btn btn-lg rounded-3 fw-600"
                    style={{ background: '#4caf80', color: '#fff', padding: '14px 32px', fontWeight: 600, boxShadow: '0 8px 25px rgba(76,175,128,0.4)' }}
                  >
                    <i className="bi bi-speedometer2 me-2"></i>Mon Tableau de Bord
                  </Link>
                ) : (
                  // Si visiteur: bouton d'inscription
                  <Link
                    to="/register"
                    className="btn btn-lg rounded-3 fw-600"
                    style={{ background: '#4caf80', color: '#fff', padding: '14px 32px', fontWeight: 600, boxShadow: '0 8px 25px rgba(76,175,128,0.4)' }}
                  >
                    <i className="bi bi-leaf-fill me-2"></i>Rejoindre la Communauté
                  </Link>
                )}
                {/* Bouton secondaire: voir la carte */}
                <Link
                  to="/map"
                  className="btn btn-lg rounded-3"
                  style={{ border: '2px solid rgba(76,175,128,0.5)', color: '#4caf80', padding: '14px 32px', background: 'transparent', fontWeight: 600 }}
                >
                  <i className="bi bi-map-fill me-2"></i>Voir la Carte
                </Link>
              </div>
            </div>

            {/* Colonne droite: carte de statistiques flottante */}
            <div className="col-lg-6 animate-fade-in-up delay-200">
              <div className="animate-float">
                <div className="glass-card p-4">
                  {/* En-tête de la carte */}
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #4caf80, #2d7a4e)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bi bi-shield-fill-check text-white fs-5"></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#000000', fontSize: '1rem' }}>Tableau de bord en direct</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.5)' }}>Mise à jour toutes les 15 minutes</div>
                    </div>
                    {/* Indicateur en direct */}
                    <div className="ms-auto d-flex align-items-center gap-1" style={{ fontSize: '0.75rem', color: '#4caf80' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#cf1b1b', display: 'inline-block', animation: 'pulse-eco 1.5s infinite' }}></span>
                      EN DIRECT
                    </div>
                  </div>

                  {/* Grille des statistiques avec animation count-up */}
                  <div className="row g-3">
                    {stats.map((stat, i) => (
                      <div key={i} className="col-6">
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 12,
                            padding: '16px',
                            textAlign: 'center',
                          }}
                        >
                          {/* Icône de la stat */}
                          <div style={{ fontSize: '1.5rem', color: stat.color, marginBottom: 8 }}>
                            <i className={`bi ${stat.icon}`}></i>
                          </div>
                          {/* Nombre animé */}
                          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#000000', lineHeight: 1 }}>
                            <CountUpNumber target={stat.value} suffix={stat.suffix} />
                          </div>
                          {/* Label */}
                          <div style={{ fontSize: '0.72rem', color: 'rgba(0, 0, 0, 0.5)', marginTop: 4 }}>{stat.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Alerte d'urgence simulée */}
                  <div
                    className="mt-4 p-3 rounded-3 d-flex align-items-start gap-3"
                    style={{ background: 'rgba(231, 76, 60, 0.15)', border: '1px solid rgba(231,76,60,0.3)' }}
                  >
                    <i className="bi bi-exclamation-triangle-fill mt-1" style={{ color: '#e74c3c', fontSize: '1rem', flexShrink: 0 }}></i>
                    <div>
                      <div style={{ fontWeight: 600, color: '#e74c3c', fontSize: '0.82rem' }}>URGENCE — Ngaba</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(2, 2, 2, 0.6)' }}>Érosion critique signalée — Quartier Mbenseke. Intervention en cours.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION ÉCO-GESTES ==================== */}
      <section style={{ padding: '80px 0', background: 'var(--eco-bg-primary)' }}>
        <div className="container">
          {/* En-tête de section */}
          <div className="text-center mb-5">
            <span className="badge mb-3 px-3 py-2 rounded-pill" style={{ background: 'rgba(45,122,78,0.12)', color: 'var(--eco-accent)', fontWeight: 600, fontSize: '0.8rem' }}>🌿 BONNES PRATIQUES</span>
            <h2 style={{ fontWeight: 800, fontSize: '2rem', color: 'var(--eco-text-primary)' }}>
              Les 4 Éco-Gestes Essentiels
            </h2>
            <p style={{ color: 'var(--eco-text-secondary)', maxWidth: 520, margin: '12px auto 0' }}>
              Adoptez ces habitudes simples pour protéger votre environnement à Kinshasa
            </p>
          </div>

          {/* Grille des 4 éco-gestes */}
          <div className="row g-4">
            {ecoGestes.map((geste, i) => (
              <div key={i} className={`col-md-6 col-lg-3 animate-fade-in-up delay-${(i + 1) * 100}`}>
                <div className="eco-card h-100 p-4 text-center">
                  {/* Icône colorée */}
                  <div
                    className="mx-auto mb-3"
                    style={{
                      width: 64, height: 64,
                      borderRadius: 18,
                      background: `${geste.color}18`,
                      border: `1.5px solid ${geste.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.8rem',
                      color: geste.color,
                    }}
                  >
                    <i className={`bi ${geste.icon}`}></i>
                  </div>
                  <h5 style={{ fontWeight: 700, color: 'var(--eco-text-primary)', marginBottom: 10, fontSize: '1rem' }}>{geste.titre}</h5>
                  <p style={{ fontSize: '0.85rem', color: 'var(--eco-text-secondary)', lineHeight: 1.7, margin: 0 }}>{geste.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SECTION RISQUES PAR COMMUNE ==================== */}
      <section style={{ padding: '60px 0', background: 'var(--eco-bg-card)' }}>
        <div className="container">
          <div className="row align-items-center g-5">
            {/* Texte explicatif */}
            <div className="col-lg-5">
              <span className="badge mb-3 px-3 py-2 rounded-pill" style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c', fontWeight: 600, fontSize: '0.8rem' }}>🔴 ZONES À RISQUE</span>
              <h2 style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--eco-text-primary)', marginBottom: 16 }}>
                Communes de Kinshasa sous surveillance
              </h2>
              <p style={{ color: 'var(--eco-text-secondary)', lineHeight: 1.8, marginBottom: 24 }}>
                Notre système d'intelligence artificielle analyse en continu les 24 communes de Kinshasa et calcule un indice de risque écologique basé sur l'historique des incidents.
              </p>
              <Link to="/map" className="btn-eco btn rounded-3">
                <i className="bi bi-map-fill me-2"></i>Explorer la carte
              </Link>
            </div>

            {/* Barres de risque par commune */}
            <div className="col-lg-7">
              <div className="d-flex flex-column gap-3">
                {communesRisques.map((c, i) => {
                  // Calcule la couleur de la barre selon le niveau de risque
                  const color = c.risque >= 80 ? '#e74c3c' : c.risque >= 60 ? '#e67e22' : c.risque >= 40 ? '#f39c12' : '#27ae60'
                  return (
                    <div key={i}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--eco-text-primary)' }}>{c.name}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--eco-text-secondary)' }}>{c.incidents} incidents • Risque: <strong style={{ color }}>{c.risque}%</strong></span>
                      </div>
                      {/* Barre de progression du risque */}
                      <div className="eco-progress">
                        <div
                          className="eco-progress-bar"
                          style={{
                            width: `${c.risque}%`,
                            background: `linear-gradient(90deg, ${color}aa, ${color})`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CTA FINAL ==================== */}
      <section
        style={{
          padding: '80px 0',
          background: 'linear-gradient(135deg, #1a3d2e 0%, #2d7a4e 50%, #1a3d2e 100%)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <h2 style={{ fontWeight: 800, color: '#fff', fontSize: '2rem', marginBottom: 16 }}>
            Chaque signalement compte pour Kinshasa 🌿
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.8 }}>
            Rejoignez les 2 841 citoyens qui contribuent déjà à rendre notre ville plus propre et plus résiliente face aux défis climatiques.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/register" className="btn btn-lg rounded-3" style={{ background: '#4caf80', color: '#fff', fontWeight: 700, padding: '14px 36px', boxShadow: '0 8px 25px rgba(76,175,128,0.4)' }}>
              <i className="bi bi-person-plus-fill me-2"></i>Créer mon compte
            </Link>
            <Link to="/education" className="btn btn-lg rounded-3" style={{ border: '2px solid rgba(255,255,255,0.3)', color: '#fff', fontWeight: 600, padding: '14px 36px', background: 'transparent' }}>
              <i className="bi bi-book-fill me-2"></i>En savoir plus
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
