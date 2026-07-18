// =============================================================
// src/pages/Login.jsx - Connexion securisee
// Authentification reliee a l'API Django/SimpleJWT.
// =============================================================
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import { InlineLoader } from '../components/Loader'

const Login = () => {
  const navigate = useNavigate()
  const { login: loginCtx } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
    setError('')
  }

  const dashboardPath = (role) => {
    if (role === 'citoyen') return '/citizen-dashboard'
    if (role === 'autorite') return '/authority-dashboard'
    return '/admin-dashboard'
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const userData = await login(form.email, form.password)
      loginCtx(userData)
      navigate(dashboardPath(userData.role))
    } catch (err) {
      setError(err.message || 'Identifiants incorrects ou compte inexistant.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--eco-bg-primary)' }}>
      <aside
        className="d-none d-lg-flex flex-column align-items-center justify-content-center"
        style={{
          width: '45%',
          background: 'linear-gradient(160deg, #0d2e1a 0%, #1a5c35 60%, #2d7a4e 100%)',
          padding: '60px 50px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(76,175,128,0.08)', top: -100, right: -100 }}></div>
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(76,175,128,0.06)', bottom: -80, left: -80 }}></div>

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 360 }}>
          <div style={{ marginBottom: 32 }}>
            <img src="/logo-eco-rdc.png" alt="Logo Eco-RDC" style={{ width: 90, height: 90, objectFit: 'contain' }} />
            <span className="fw-700 d-none d-md-block" style={{ fontWeight: 800, fontSize: '3.05rem', color: '#fff' }}>
              Eco<span style={{ color: '#4caf80' }}>RDC</span>
            </span>
          </div>

          {[
            { icon: 'bi-lightning-fill', text: 'Signalement en temps reel' },
            { icon: 'bi-cpu-fill', text: 'Analyse IA operationnelle' },
            { icon: 'bi-map-fill', text: 'Carte SIG interactive' },
            { icon: 'bi-shield-lock-fill', text: 'Acces securise par role' },
          ].map((item) => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(76,175,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`bi ${item.icon}`} style={{ color: '#4caf80' }}></i>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.86)', fontSize: '0.88rem', fontWeight: 500 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </aside>

      <main className="d-flex flex-column align-items-center justify-content-center flex-grow-1" style={{ padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div className="mb-5">
            <h1 style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--eco-text-primary)', marginBottom: 8 }}>Bon retour</h1>
            <p style={{ color: 'var(--eco-text-secondary)', margin: 0 }}>Connectez-vous pour acceder a votre espace EcoRDC.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--eco-text-primary)', marginBottom: 6, display: 'block' }}>Adresse email</label>
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

            <div className="mb-4">
              <label style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--eco-text-primary)', marginBottom: 6, display: 'block' }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-lock-fill" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--eco-text-secondary)', fontSize: '0.95rem' }}></i>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="eco-input"
                  placeholder="Mot de passe"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--eco-text-secondary)', fontSize: '1rem' }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </button>
              </div>
            </div>

            {error && (
              <div className="alert d-flex align-items-center gap-2 py-2 px-3 mb-4 rounded-3" style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', fontSize: '0.85rem' }}>
                <i className="bi bi-exclamation-circle-fill"></i> {error}
              </div>
            )}

            <button id="btn-login-submit" type="submit" className="btn-eco btn w-100 rounded-3" style={{ padding: '14px', fontSize: '1rem', marginBottom: 20 }} disabled={loading}>
              {loading ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <InlineLoader size="sm" /> Connexion en cours...
                </span>
              ) : (
                <span><i className="bi bi-box-arrow-in-right me-2"></i>Se connecter</span>
              )}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--eco-text-secondary)', margin: 0 }}>
              Pas encore de compte ?{' '}
              <Link to="/register" style={{ color: 'var(--eco-accent)', fontWeight: 600, textDecoration: 'none' }}>S'inscrire gratuitement</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}

export default Login
