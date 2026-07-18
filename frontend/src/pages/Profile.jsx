// =============================================================
// src/pages/Profile.jsx - Gestion du profil connectee au backend.
// La photo, la commune et l'adresse exacte sont sauvegardees via
// l'endpoint auth/me puis reinjectees dans la session frontend.
// =============================================================
import React, { useEffect, useRef, useState } from 'react'
import { updateProfile } from '../api/authApi'
import { getCommunes } from '../api/signalementApi'
import { InlineLoader } from '../components/Loader'
import UserAvatar from '../components/UserAvatar'
import { useAuth } from '../context/AuthContext'

const roleLabels = {
  citoyen: 'Eco-citoyen',
  autorite: 'Autorite urbaine',
  ministere: 'Ministere',
  admin: 'Administration',
}

const roleColors = {
  citoyen: '#27ae60',
  autorite: '#2980b9',
  ministere: '#7d3c98',
  admin: '#2c3e50',
}

const Profile = () => {
  const { user, login: loginCtx } = useAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    commune: user?.commune_id || '',
    address_line: user?.address_line || '',
  })
  const [communes, setCommunes] = useState([])
  const [avatar, setAvatar] = useState(user?.avatar || null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    const loadCommunes = async () => {
      try {
        const data = await getCommunes()
        setCommunes(data)
        if (!user?.commune_id && user?.commune) {
          const current = data.find((item) => item.name === user.commune)
          if (current) setForm((previous) => ({ ...previous, commune: current.id }))
        }
      } catch (error) {
        console.error('Chargement des communes impossible :', error)
      }
    }
    loadCommunes()
  }, [user?.commune, user?.commune_id])

  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }))

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const [firstName, ...lastNameParts] = form.name.trim().split(/\s+/)
      const payload = new FormData()
      payload.append('first_name', firstName || '')
      payload.append('last_name', lastNameParts.join(' '))
      payload.append('email', form.email)
      payload.append('phone', form.phone || '')
      payload.append('address_line', form.address_line || '')
      if (form.commune) payload.append('commune', form.commune)
      if (avatarFile) payload.append('avatar', avatarFile)

      const updated = await updateProfile(payload)
      loginCtx({
        ...user,
        ...updated,
        token: updated.token || user?.token,
        refresh: updated.refresh || user?.refresh,
        avatar: updated.avatar || avatar,
        address_line: updated.address_line || form.address_line,
      })
      setMessage({ type: 'success', text: 'Profil mis a jour avec succes.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la mise a jour du profil.' })
    } finally {
      setSaving(false)
    }
  }

  const roleColor = roleColors[user?.role] || '#27ae60'

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--eco-text-primary)', marginBottom: 24 }}>
        <i className="bi bi-person-circle me-2" style={{ color: 'var(--eco-accent)' }}></i>
        Mon profil
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-md-4">
            <section className="eco-card p-4 text-center">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <UserAvatar
                  user={user}
                  src={avatar}
                  size={124}
                  preview={Boolean(avatar)}
                  title="Voir la photo de profil"
                  className="eco-profile-avatar"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Changer la photo de profil"
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'var(--eco-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid var(--eco-bg-card)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  <i className="bi bi-camera-fill text-white" style={{ fontSize: '0.78rem' }}></i>
                </button>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />

              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--eco-text-primary)' }}>{user?.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--eco-text-secondary)', marginTop: 4 }}>{user?.email}</div>
                <div className="mt-3">
                  <span style={{ background: `${roleColor}18`, color: roleColor, padding: '6px 14px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 800, border: `1px solid ${roleColor}44` }}>
                    {roleLabels[user?.role] || 'Utilisateur'}
                  </span>
                </div>
              </div>

              {user?.stats && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--eco-border)' }}>
                  {Object.entries({
                    Signalements: user.stats.signalements,
                    Resolus: user.stats.resolus,
                    'En cours': user.stats.enCours,
                  }).map(([label, value]) => (
                    <div key={label} className="d-flex justify-content-between py-2" style={{ borderBottom: '1px solid var(--eco-border)', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--eco-text-secondary)' }}>{label}</span>
                      <span style={{ fontWeight: 800, color: 'var(--eco-text-primary)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="col-md-8">
            <section className="eco-card p-4">
              <h2 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--eco-text-primary)', marginBottom: 20 }}>
                Informations personnelles
              </h2>
              <div className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label fw-semibold">Nom complet</label>
                  <input name="name" type="text" className="eco-input" value={form.name} onChange={handleChange} placeholder="Nom et post-nom" />
                </div>
                <div>
                  <label className="form-label fw-semibold">Adresse email</label>
                  <input name="email" type="email" className="eco-input" value={form.email} onChange={handleChange} />
                </div>
                <div>
                  <label className="form-label fw-semibold">Telephone</label>
                  <input name="phone" type="tel" className="eco-input" value={form.phone} onChange={handleChange} placeholder="+243 81 000 0000" />
                </div>
                <div>
                  <label className="form-label fw-semibold">Commune de residence</label>
                  <select name="commune" className="eco-input" value={form.commune} onChange={handleChange}>
                    <option value="">Selectionner une commune</option>
                    {communes.map((commune) => <option key={commune.id} value={commune.id}>{commune.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label fw-semibold">Adresse exacte ou repere</label>
                  <input name="address_line" type="text" className="eco-input" value={form.address_line} onChange={handleChange} placeholder="Avenue, quartier, numero ou reference proche" />
                </div>

                {message.text && (
                  <div style={{ padding: '10px 16px', borderRadius: 8, background: message.type === 'success' ? 'rgba(39,174,96,0.1)' : 'rgba(231,76,60,0.1)', border: `1px solid ${message.type === 'success' ? 'rgba(39,174,96,0.3)' : 'rgba(231,76,60,0.3)'}`, color: message.type === 'success' ? '#27ae60' : '#e74c3c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
                    {message.text}
                  </div>
                )}

                <button id="btn-save-profile" type="submit" className="btn-eco btn rounded-3" style={{ padding: 13, fontSize: '0.95rem', alignSelf: 'flex-start', minWidth: 200 }} disabled={saving}>
                  {saving
                    ? <span className="d-flex align-items-center gap-2"><InlineLoader size="sm" />Sauvegarde...</span>
                    : <span><i className="bi bi-check2-circle me-2"></i>Sauvegarder</span>
                  }
                </button>
              </div>
            </section>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Profile
