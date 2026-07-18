// =============================================================
// src/pages/Register.jsx - Inscription citoyenne
// Les comptes institutionnels sont crees par les administrateurs.
// =============================================================
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import { getCommunes } from '../api/signalementApi'
import { InlineLoader } from '../components/Loader'

const initialForm = {
  prenom: '',
  nom: '',
  email: '',
  phone: '',
  commune: '',
  address_line: '',
  password: '',
  confirmPassword: '',
}

const Register = () => {
  const navigate = useNavigate()
  const { login: loginCtx } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [communes, setCommunes] = useState([])
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCommunes().then(setCommunes).catch(() => setCommunes([]))
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setApiError('')
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.prenom.trim()) nextErrors.prenom = 'Le prenom est requis.'
    if (!form.nom.trim()) nextErrors.nom = 'Le nom est requis.'
    if (!form.email.trim()) nextErrors.email = "L'email est requis."
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) nextErrors.email = "Format d'email invalide."
    if (!form.phone.trim()) nextErrors.phone = 'Le telephone est requis.'
    if (!form.commune) nextErrors.commune = 'Choisissez votre commune.'
    if (!form.address_line.trim()) nextErrors.address_line = 'Ajoutez une adresse exacte ou un repere.'
    if (!form.password) nextErrors.password = 'Le mot de passe est requis.'
    else if (form.password.length < 8) nextErrors.password = 'Minimum 8 caracteres.'
    else if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      nextErrors.password = 'Utilisez majuscule, minuscule et chiffre.'
    } else if (/^\d+$/.test(form.password)) {
      nextErrors.password = 'Le mot de passe ne peut pas etre uniquement numerique.'
    }
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Les mots de passe ne correspondent pas.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setLoading(true)
    setApiError('')
    try {
      const userData = await register(form)
      loginCtx(userData)
      navigate('/citizen-dashboard')
    } catch (error) {
      setApiError(error.message || "Impossible de creer le compte citoyen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--eco-bg-primary)', padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <header className="text-center mb-5 animate-fade-in-up">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <img src="/logo-eco-rdc.png" alt="Logo Eco-RDC" style={{ width: 86, height: 86, objectFit: 'contain' }} />
        </Link>
        <h1 style={{ fontWeight: 800, color: 'var(--eco-text-primary)', marginBottom: 8, fontSize: '1.9rem' }}>Creer un compte citoyen</h1>
        <p style={{ color: 'var(--eco-text-secondary)', fontSize: '1rem', maxWidth: 460, margin: '0 auto' }}>
          Signalez les incidents environnementaux et suivez leur traitement depuis votre espace personnel.
        </p>
      </header>

      <main style={{ maxWidth: 720, width: '100%' }}>
        <form className="eco-card p-4 p-md-5" onSubmit={handleSubmit} noValidate>
          <div className="mb-4 p-3" style={{ background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 8, background: '#27ae6020', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-person-check-fill" style={{ color: '#27ae60', fontSize: '1.35rem' }}></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--eco-text-primary)' }}>Inscription citoyenne</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--eco-text-secondary)' }}>Les comptes autorites, ministere et admin sont crees en interne.</p>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Prenom</label>
              <input name="prenom" type="text" className={`eco-input ${errors.prenom ? 'is-invalid' : ''}`} value={form.prenom} onChange={handleChange} />
              {errors.prenom && <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}>{errors.prenom}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Nom</label>
              <input name="nom" type="text" className={`eco-input ${errors.nom ? 'is-invalid' : ''}`} value={form.nom} onChange={handleChange} />
              {errors.nom && <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}>{errors.nom}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Adresse email</label>
              <input name="email" type="email" className={`eco-input ${errors.email ? 'is-invalid' : ''}`} placeholder="nom@email.cd" value={form.email} onChange={handleChange} />
              {errors.email && <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}>{errors.email}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Telephone</label>
              <input name="phone" type="tel" className={`eco-input ${errors.phone ? 'is-invalid' : ''}`} placeholder="+243 81 000 0000" value={form.phone} onChange={handleChange} />
              {errors.phone && <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}>{errors.phone}</div>}
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Commune</label>
              <select name="commune" className={`eco-input ${errors.commune ? 'is-invalid' : ''}`} value={form.commune} onChange={handleChange}>
                <option value="">Selectionner une commune</option>
                {communes.map((commune) => <option key={commune.id} value={commune.id}>{commune.name}</option>)}
              </select>
              {errors.commune && <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}>{errors.commune}</div>}
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Adresse exacte ou repere</label>
              <input name="address_line" type="text" className={`eco-input ${errors.address_line ? 'is-invalid' : ''}`} placeholder="Avenue, quartier, numero ou reference proche" value={form.address_line} onChange={handleChange} />
              {errors.address_line && <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}>{errors.address_line}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Mot de passe</label>
              <input name="password" type="password" className={`eco-input ${errors.password ? 'is-invalid' : ''}`} value={form.password} onChange={handleChange} />
              {errors.password ? (
                <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}>{errors.password}</div>
              ) : (
                <div style={{ color: 'var(--eco-text-secondary)', fontSize: '0.75rem', marginTop: 4 }}>Minimum 8 caracteres avec majuscule, minuscule et chiffre.</div>
              )}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Confirmation</label>
              <input name="confirmPassword" type="password" className={`eco-input ${errors.confirmPassword ? 'is-invalid' : ''}`} value={form.confirmPassword} onChange={handleChange} />
              {errors.confirmPassword && <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}>{errors.confirmPassword}</div>}
            </div>

            {apiError && (
              <div className="col-12">
                <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', fontSize: '0.85rem', padding: '12px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-exclamation-triangle-fill"></i> {apiError}
                </div>
              </div>
            )}

            <div className="col-12 pt-2">
              <button id="btn-register-submit" type="submit" className="btn-eco btn w-100 rounded-3 d-flex align-items-center justify-content-center gap-2" style={{ padding: '14px', fontSize: '1rem', fontWeight: 700 }} disabled={loading}>
                {loading ? <><InlineLoader size="sm" /> Creation du compte...</> : <><i className="bi bi-person-plus-fill"></i> Creer mon compte citoyen</>}
              </button>
              <p className="text-center mt-4" style={{ fontSize: '0.9rem', color: 'var(--eco-text-secondary)', marginBottom: 0 }}>
                Deja inscrit ? <Link to="/login" style={{ color: 'var(--eco-accent)', fontWeight: 700, textDecoration: 'none' }}>Se connecter</Link>
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

export default Register
