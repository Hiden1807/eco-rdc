// =============================================================
// src/pages/Register.jsx — Page d'inscription (Citoyen Uniquement)
// Les comptes Inspecteurs (Autorités) sont créés via la base de données.
// =============================================================
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import { COMMUNES_KINSHASA } from '../api/signalementApi'
import { InlineLoader } from '../components/Loader'

const Register = () => {
  const navigate = useNavigate()
  const { login: loginCtx } = useAuth()

  // Données du formulaire d'inscription (rôle forcé à 'citoyen')
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', password: '', confirmPassword: '',
    role: 'citoyen', commune: '', phone: '',
  })
  // État d'erreurs de validation
  const [errors, setErrors] = useState({})
  // État de chargement
  const [loading, setLoading] = useState(false)
  // Erreur générale de l'API
  const [apiError, setApiError] = useState('')

  /**
   * handleChange — Met à jour le champ du formulaire
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  /**
   * validate — Valide les données du formulaire
   */
  const validate = () => {
    const newErrors = {}
    if (!form.prenom.trim()) newErrors.prenom = 'Le prénom est requis'
    if (!form.nom.trim()) newErrors.nom = 'Le nom est requis'
    if (!form.email.trim()) newErrors.email = 'L\'email est requis'
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) newErrors.email = 'Format d\'email invalide'
    if (!form.password) newErrors.password = 'Le mot de passe est requis'
    else if (form.password.length < 8) newErrors.password = 'Minimum 8 caractères'
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    if (!form.commune) newErrors.commune = 'Choisissez votre commune'
    if (!form.phone.trim()) newErrors.phone = 'Le téléphone est requis'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * handleSubmit — Soumet le formulaire d'inscription
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setApiError('')
    try {
      const userData = await register(form)
      loginCtx(userData)
      navigate('/citizen-dashboard')
    } catch (err) {
      setApiError(err.message || 'Erreur lors de l\'inscription.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--eco-bg-primary)', padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* ---- EN-TÊTE ---- */}
      <div className="text-center mb-5 animate-fade-in-up">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <img
            src="/logo-eco-rdc.png"
            alt="Logo Eco-RDC"
            style={{
              width: 90, height: 90,
              objectFit: 'contain',
            }}
          />
        </Link>
        <h1 style={{ fontWeight: 800, color: 'var(--eco-text-primary)', marginBottom: 8, fontSize: '2rem' }}>Rejoindre EcoRDC</h1>
        <p style={{ color: 'var(--eco-text-secondary)', fontSize: '1rem', maxWidth: 400, margin: '0 auto' }}>
          Créez votre compte Éco-Citoyen et contribuez à une ville de Kinshasa plus propre.
        </p>
      </div>

      <div style={{ maxWidth: 700, width: '100%' }} className="animate-fade-in delay-200">
        <div className="eco-card glass-card p-4 p-md-5" style={{ background: 'var(--eco-bg-card)' }}>
          {/* Badge Citoyen */}
          <div className="mb-4 p-3 rounded-4" style={{ background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#27ae6020', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-person-heart" style={{ color: '#27ae60', fontSize: '1.5rem' }}></i>
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--eco-text-primary)' }}>Inscription : Éco-Citoyen 🌱</h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--eco-text-secondary)' }}>Les comptes Autorités sont créés en interne.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="row g-4">
              <div className="col-md-6">
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--eco-text-primary)', marginBottom: 8, display: 'block' }}>Prénom <span className="text-danger">*</span></label>
                <input name="prenom" type="text" className={`eco-input ${errors.prenom ? 'is-invalid' : ''}`} placeholder="Jean-Pierre" value={form.prenom} onChange={handleChange} />
                {errors.prenom && <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}><i className="bi bi-info-circle me-1"></i>{errors.prenom}</div>}
              </div>

              <div className="col-md-6">
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--eco-text-primary)', marginBottom: 8, display: 'block' }}>Nom <span className="text-danger">*</span></label>
                <input name="nom" type="text" className={`eco-input ${errors.nom ? 'is-invalid' : ''}`} placeholder="Kabila" value={form.nom} onChange={handleChange} />
                {errors.nom && <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}><i className="bi bi-info-circle me-1"></i>{errors.nom}</div>}
              </div>

              <div className="col-12">
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--eco-text-primary)', marginBottom: 8, display: 'block' }}>Adresse Email <span className="text-danger">*</span></label>
                <input name="email" type="email" className={`eco-input ${errors.email ? 'is-invalid' : ''}`} placeholder="nom@email.cd" value={form.email} onChange={handleChange} />
                {errors.email && <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}><i className="bi bi-info-circle me-1"></i>{errors.email}</div>}
              </div>

              <div className="col-md-6">
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--eco-text-primary)', marginBottom: 8, display: 'block' }}>Téléphone <span className="text-danger">*</span></label>
                <input name="phone" type="tel" className={`eco-input ${errors.phone ? 'is-invalid' : ''}`} placeholder="+243 81 000 0000" value={form.phone} onChange={handleChange} />
                {errors.phone && <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}><i className="bi bi-info-circle me-1"></i>{errors.phone}</div>}
              </div>

              <div className="col-md-6">
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--eco-text-primary)', marginBottom: 8, display: 'block' }}>Commune <span className="text-danger">*</span></label>
                <select name="commune" className={`eco-input ${errors.commune ? 'is-invalid' : ''}`} value={form.commune} onChange={handleChange}>
                  <option value="">Sélectionnez votre commune</option>
                  {COMMUNES_KINSHASA.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
                {errors.commune && <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}><i className="bi bi-info-circle me-1"></i>{errors.commune}</div>}
              </div>

              <div className="col-md-6">
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--eco-text-primary)', marginBottom: 8, display: 'block' }}>Mot de Passe <span className="text-danger">*</span></label>
                <input name="password" type="password" className={`eco-input ${errors.password ? 'is-invalid' : ''}`} placeholder="Minimum 8 caractères" value={form.password} onChange={handleChange} />
                {errors.password && <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}><i className="bi bi-info-circle me-1"></i>{errors.password}</div>}
              </div>

              <div className="col-md-6">
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--eco-text-primary)', marginBottom: 8, display: 'block' }}>Confirmer le Mot de Passe <span className="text-danger">*</span></label>
                <input name="confirmPassword" type="password" className={`eco-input ${errors.confirmPassword ? 'is-invalid' : ''}`} placeholder="Répétez le mot de passe" value={form.confirmPassword} onChange={handleChange} />
                {errors.confirmPassword && <div style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}><i className="bi bi-info-circle me-1"></i>{errors.confirmPassword}</div>}
              </div>

              {apiError && (
                <div className="col-12">
                  <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', fontSize: '0.85rem', padding: '12px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="bi bi-exclamation-triangle-fill"></i> {apiError}
                  </div>
                </div>
              )}

              <div className="col-12 mt-4 pt-2 border-top" style={{ borderColor: 'var(--eco-border) !important' }}>
                <button id="btn-register-submit" type="submit" className="btn-eco btn w-100 rounded-3 d-flex align-items-center justify-content-center gap-2" style={{ padding: '14px', fontSize: '1rem', fontWeight: 700 }} disabled={loading}>
                  {loading ? <><InlineLoader size="sm" /> Création du compte...</> : <><i className="bi bi-person-plus-fill"></i> Créer mon Compte Citoyen</>}
                </button>
                <div className="text-center mt-4">
                  <p style={{ fontSize: '0.9rem', color: 'var(--eco-text-secondary)', margin: 0 }}>
                    Déjà inscrit ? <Link to="/login" style={{ color: 'var(--eco-accent)', fontWeight: 700, textDecoration: 'none' }}>Se connecter</Link>
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
