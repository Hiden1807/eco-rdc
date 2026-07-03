// =============================================================
// src/pages/Profile.jsx — Page de gestion du profil utilisateur
// Modification des informations + téléversement de photo de profil
// =============================================================
import React, { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../api/authApi'
import { COMMUNES_KINSHASA } from '../api/signalementApi'
import { InlineLoader } from '../components/Loader'

const Profile = () => {
  const { user, login: loginCtx } = useAuth()
  // Référence vers l'input fichier caché (déclenchement par clic sur l'avatar)
  const fileInputRef = useRef(null)

  // État du formulaire initialisé avec les données actuelles de l'utilisateur
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    commune: user?.commune || '',
  })
  // État de l'aperçu de la nouvelle photo de profil
  const [avatar, setAvatar] = useState(user?.avatar || null)
  // État de chargement de la sauvegarde
  const [saving, setSaving] = useState(false)
  // Message de succès ou d'erreur après sauvegarde
  const [message, setMessage] = useState({ type: '', text: '' })

  /**
   * handleChange — Met à jour un champ du formulaire
   */
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  /**
   * handleAvatarChange — Charge et prévisualise une nouvelle photo de profil
   * Note Backend: Utiliser FormData avec ce fichier pour l'upload
   */
  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result) // Stocke l'aperçu base64
    reader.readAsDataURL(file)
  }

  /**
   * handleSubmit — Sauvegarde les modifications du profil
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const updated = await updateProfile({ ...form, avatar })
      // Met à jour la session utilisateur avec les nouvelles données
      loginCtx({ ...user, ...form, avatar })
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' })
    } catch (e) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px' }}>

      <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--eco-text-primary)', marginBottom: 24 }}>
        <i className="bi bi-person-circle me-2" style={{ color: 'var(--eco-accent)' }}></i>
        Mon Profil
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">

          {/* ==================== PANNEAU GAUCHE — AVATAR ==================== */}
          <div className="col-md-4">
            <div className="eco-card p-4 text-center">
              {/* Zone de l'avatar cliquable */}
              <div
                style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div
                  style={{
                    width: 120, height: 120,
                    borderRadius: '50%',
                    background: avatar ? 'transparent' : 'var(--eco-accent-gradient)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto',
                    border: '4px solid var(--eco-border)',
                    overflow: 'hidden',
                    boxShadow: '0 6px 24px rgba(45,122,78,0.2)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {avatar ? (
                    <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontWeight: 800, fontSize: '2.8rem', color: '#fff' }}>
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                {/* Bouton d'édition de l'avatar */}
                <div
                  style={{
                    position: 'absolute', bottom: 4, right: 4,
                    width: 32, height: 32,
                    borderRadius: '50%',
                    background: 'var(--eco-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '3px solid var(--eco-bg-card)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  <i className="bi bi-camera-fill text-white" style={{ fontSize: '0.75rem' }}></i>
                </div>
              </div>

              {/* Input fichier caché */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />

              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--eco-text-primary)' }}>{user?.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--eco-text-secondary)', marginTop: 4 }}>{user?.email}</div>
                {/* Badge du rôle */}
                <div className="mt-3">
                  <span style={{
                    background: user?.role === 'autorite' ? 'rgba(41,128,185,0.1)' : 'rgba(39,174,96,0.1)',
                    color: user?.role === 'autorite' ? '#2980b9' : '#27ae60',
                    padding: '5px 14px',
                    borderRadius: 99,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: `1px solid ${user?.role === 'autorite' ? 'rgba(41,128,185,0.25)' : 'rgba(39,174,96,0.25)'}`,
                  }}>
                    {user?.role === 'autorite' ? '🏛️ Autorité Urbaine' : '🌱 Éco-Citoyen'}
                  </span>
                </div>
              </div>

              {/* Statistiques rapides */}
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--eco-border)' }}>
                {user?.stats && Object.entries({
                  'Signalements': user.stats.signalements,
                  'Résolus': user.stats.resolus,
                  'En Cours': user.stats.enCours,
                }).map(([label, val]) => (
                  <div key={label} className="d-flex justify-content-between py-2" style={{ borderBottom: '1px solid var(--eco-border)', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--eco-text-secondary)' }}>{label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--eco-text-primary)' }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Bouton de suppression de l'avatar */}
              {avatar && (
                <button
                  type="button"
                  onClick={() => setAvatar(null)}
                  className="btn btn-sm btn-link mt-3 p-0"
                  style={{ color: '#e74c3c', fontSize: '0.75rem', textDecoration: 'none' }}
                >
                  <i className="bi bi-x-circle me-1"></i>Supprimer la photo
                </button>
              )}
            </div>
          </div>

          {/* ==================== PANNEAU DROIT — FORMULAIRE ==================== */}
          <div className="col-md-8">
            <div className="eco-card p-4">
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--eco-text-primary)', marginBottom: 20 }}>
                Informations Personnelles
              </h3>
              <div className="d-flex flex-column gap-4">
                {/* Nom complet */}
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--eco-text-primary)', marginBottom: 6, display: 'block' }}>
                    Nom complet
                  </label>
                  <input name="name" type="text" className="eco-input" value={form.name} onChange={handleChange} placeholder="Jean-Pierre Kabila" />
                </div>

                {/* Email */}
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--eco-text-primary)', marginBottom: 6, display: 'block' }}>
                    Adresse Email
                  </label>
                  <input name="email" type="email" className="eco-input" value={form.email} onChange={handleChange} />
                </div>

                {/* Téléphone */}
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--eco-text-primary)', marginBottom: 6, display: 'block' }}>
                    Téléphone
                  </label>
                  <input name="phone" type="tel" className="eco-input" value={form.phone} onChange={handleChange} placeholder="+243 81 000 0000" />
                </div>

                {/* Commune */}
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--eco-text-primary)', marginBottom: 6, display: 'block' }}>
                    Commune de résidence
                  </label>
                  <select name="commune" className="eco-input" value={form.commune} onChange={handleChange}>
                    <option value="">Sélectionner une commune</option>
                    {COMMUNES_KINSHASA.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Message de feedback */}
                {message.text && (
                  <div
                    style={{
                      padding: '10px 16px',
                      borderRadius: 10,
                      background: message.type === 'success' ? 'rgba(39,174,96,0.1)' : 'rgba(231,76,60,0.1)',
                      border: `1px solid ${message.type === 'success' ? 'rgba(39,174,96,0.3)' : 'rgba(231,76,60,0.3)'}`,
                      color: message.type === 'success' ? '#27ae60' : '#e74c3c',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
                    {message.text}
                  </div>
                )}

                {/* Bouton de sauvegarde */}
                <button
                  id="btn-save-profile"
                  type="submit"
                  className="btn-eco btn rounded-3"
                  style={{ padding: '13px', fontSize: '0.95rem', alignSelf: 'flex-start', minWidth: 200 }}
                  disabled={saving}
                >
                  {saving
                    ? <span className="d-flex align-items-center gap-2"><InlineLoader size="sm" /> Sauvegarde...</span>
                    : <span><i className="bi bi-check2-circle me-2"></i>Sauvegarder</span>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Profile
