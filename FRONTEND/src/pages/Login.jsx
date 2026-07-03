// =============================================================
// src/pages/Login.jsx — Page de connexion
// Design: Écran partagé diagonal — gauche branding, droite formulaire
// =============================================================
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import { InlineLoader } from '../components/Loader'

const Login = () => {
  // Hook de navigation pour rediriger après connexion
  const navigate = useNavigate()
  // Accès au contexte d'auth pour sauvegarder la session
  const { login: loginCtx } = useAuth()

  // État du formulaire: email et mot de passe
  const [form, setForm] = useState({ email: '', password: '' })
  // État d'erreur d'authentification
  const [error, setError] = useState('')
  // État de chargement pendant la requête
  const [loading, setLoading] = useState(false)
  // État de visibilité du mot de passe
  const [showPassword, setShowPassword] = useState(false)

  /**
   * handleChange — Met à jour le champ du formulaire correspondant
   * @param {Event} e - L'événement de changement du champ
   */
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('') // Efface l'erreur dès que l'utilisateur tape
  }

  /**
   * handleSubmit — Soumet le formulaire et authentifie l'utilisateur
   * @param {Event} e - L'événement de soumission du formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault() // Empêche le rechargement de la page
    setLoading(true)
    setError('')
    try {
      // Appel à l'API d'authentification (mock ou réelle)
      const userData = await login(form.email, form.password)
      loginCtx(userData) // Sauvegarde la session dans le contexte
      // Redirige selon le rôle de l'utilisateur
      navigate(userData.role === 'autorite' ? '/authority-dashboard' : '/citizen-dashboard')
    } catch (err) {
      setError(err.message || 'Erreur de connexion. Vérifiez vos identifiants.')
    } finally {
      setLoading(false) // Arrête le spinner dans tous les cas
    }
  }

  // Comptes de démonstration pour faciliter les tests
  const demoAccounts = [
    { label: 'Citoyen', email: 'citoyen@ecokinshasa.cd', password: 'password123', icon: '🌱', color: '#27ae60' },
    { label: 'Autorité', email: 'autorite@ecokinshasa.cd', password: 'admin2024', icon: '🏛️', color: '#2980b9' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--eco-bg-primary)' }}>

      {/* ==================== PANNEAU GAUCHE — BRANDING ==================== */}
      <div
        className="d-none d-lg-flex flex-column align-items-center justify-content-center"
        style={{
          width: '45%',
          background: 'linear-gradient(160deg, #0d2e1a 0%, #1a5c35 60%, #2d7a4e 100%)',
          padding: '60px 50px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Cercle décoratif en arrière-plan */}
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(76,175,128,0.08)', top: -100, right: -100 }}></div>
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(76,175,128,0.06)', bottom: -80, left: -80 }}></div>

        {/* Contenu du panneau */}
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 360 }}>
          {/* Logo animé */}
          <div className="animate-float" style={{ marginBottom: 32 }}>
            <img
              src="/logo-eco-rdc.png"
              alt="Logo Eco-RDC"
              style={{
                width: 90, height: 90,
                objectFit: 'contain',
              }}
            />
            <span
              className="fw-700 d-none d-md-block"
              style={{ fontWeight: 800, fontSize: '3.05rem', color: 'var(--eco-text-primary)', letterSpacing: '-0.3px' }}
            >
              Eco<span style={{ color: 'var(--eco-accent)' }}>RDC</span>
            </span>
          </div>

          {/* Points forts de la plateforme */}
          {[
            { icon: 'bi-lightning-fill', text: 'Signalement en temps réel' },
            { icon: 'bi-cpu-fill', text: 'Analyse IA des incidents' },
            { icon: 'bi-map-fill', text: 'Carte SIG interactive' },
            { icon: 'bi-people-fill', text: '2 841 citoyens actifs' },
          ].map((item, i) => (
            <div
              key={i}
              className={`animate-fade-in-up delay-${i * 100 + 200}`}
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(76,175,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`bi ${item.icon}`} style={{ color: '#4caf80' }}></i>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.88rem', fontWeight: 500 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== PANNEAU DROIT — FORMULAIRE ==================== */}
      <div
        className="d-flex flex-column align-items-center justify-content-center flex-grow-1"
        style={{ padding: '40px 24px' }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* En-tête du formulaire */}
          <div className="mb-5">
            <h1 style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--eco-text-primary)', marginBottom: 8 }}>Bon retour ! 👋</h1>
            <p style={{ color: 'var(--eco-text-secondary)', margin: 0 }}>Connectez-vous pour accéder à votre espace EcoRDC</p>
          </div>

          {/* ---- COMPTES DE DÉMONSTRATION ---- */}
          <div className="mb-4">
            <p style={{ fontSize: '0.8rem', color: 'var(--eco-text-secondary)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comptes de démonstration</p>
            <div className="d-flex gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  onClick={() => setForm({ email: account.email, password: account.password })}
                  className="btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-2 rounded-3"
                  style={{ border: `1.5px solid ${account.color}40`, background: `${account.color}10`, color: 'var(--eco-text-primary)', padding: '10px', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  <span>{account.icon}</span> {account.label}
                </button>
              ))}
            </div>
          </div>

          {/* ---- FORMULAIRE DE CONNEXION ---- */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Champ Email */}
            <div className="mb-4">
              <label style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--eco-text-primary)', marginBottom: 6, display: 'block' }}>Adresse Email</label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-envelope-fill" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--eco-text-secondary)', fontSize: '0.95rem' }}></i>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  className="eco-input"
                  placeholder="votre@email.cd"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: 42 }}
                />
              </div>
            </div>

            {/* Champ Mot de Passe */}
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-1">
                <label style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--eco-text-primary)' }}>Mot de Passe</label>
                <a href="#" style={{ fontSize: '0.82rem', color: 'var(--eco-accent)', textDecoration: 'none' }}>Oublié ?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-lock-fill" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--eco-text-secondary)', fontSize: '0.95rem' }}></i>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="eco-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                />
                {/* Bouton afficher/masquer le mot de passe */}
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--eco-text-secondary)', fontSize: '1rem' }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </button>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="alert d-flex align-items-center gap-2 py-2 px-3 mb-4 rounded-3" style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', fontSize: '0.85rem' }}>
                <i className="bi bi-exclamation-circle-fill"></i> {error}
              </div>
            )}

            {/* Bouton de soumission */}
            <button
              id="btn-login-submit"
              type="submit"
              className="btn-eco btn w-100 rounded-3"
              style={{ padding: '14px', fontSize: '1rem', marginBottom: 20 }}
              disabled={loading}
            >
              {loading ? (
                // Affiche le spinner pendant le chargement
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <InlineLoader size="sm" /> Connexion en cours...
                </span>
              ) : (
                <span><i className="bi bi-box-arrow-in-right me-2"></i>Se Connecter</span>
              )}
            </button>

            {/* Lien d'inscription */}
            <p style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--eco-text-secondary)', margin: 0 }}>
              Pas encore de compte ?{' '}
              <Link to="/register" style={{ color: 'var(--eco-accent)', fontWeight: 600, textDecoration: 'none' }}>S'inscrire gratuitement</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
