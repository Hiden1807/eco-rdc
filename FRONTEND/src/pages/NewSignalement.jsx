// =============================================================
// src/pages/NewSignalement.jsx — Formulaire de signalement intelligent
// Géolocalisation native HTML5 + téléversement photo + analyse IA
// =============================================================
import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createSignalement, COMMUNES_KINSHASA, TYPES_INCIDENT } from '../api/signalementApi'
import { analyserIncident } from '../api/aiApi'
import { InlineLoader } from '../components/Loader'

const NewSignalement = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  // Référence vers l'input fichier caché (pour déclencher depuis un bouton stylisé)
  const fileInputRef = useRef(null)

  // État du formulaire principal
  const [form, setForm] = useState({
    titre: '', type: '', commune: user?.commune || '',
    description: '', lat: '', lng: '',
  })
  // État de la photo sélectionnée (fichier + aperçu base64)
  const [photo, setPhoto] = useState({ file: null, preview: null })
  // État des erreurs de validation par champ
  const [errors, setErrors] = useState({})
  // État de la géolocalisation : 'idle' | 'loading' | 'success' | 'error'
  const [geoStatus, setGeoStatus] = useState('idle')
  // État de l'analyse IA en cours
  const [aiLoading, setAiLoading] = useState(false)
  // Résultat de l'analyse IA
  const [aiResult, setAiResult] = useState(null)
  // État de soumission du formulaire
  const [submitting, setSubmitting] = useState(false)
  // État de succès après soumission
  const [success, setSuccess] = useState(false)

  /**
   * handleChange — Met à jour le champ du formulaire et efface son erreur
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }))
  }

  /**
   * handlePhotoChange — Charge la photo sélectionnée et génère un aperçu
   */
  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    // Une fois le fichier lu, stocke l'aperçu base64 dans l'état
    reader.onload = () => setPhoto({ file, preview: reader.result })
    reader.readAsDataURL(file)
  }

  /**
   * handleGeolocate — Demande la position GPS via l'API Geolocation du navigateur
   * Utilise navigator.geolocation (HTML5 natif — aucune dépendance)
   */
  const handleGeolocate = () => {
    // Vérifie si le navigateur supporte la géolocalisation
    if (!navigator.geolocation) {
      setGeoStatus('error')
      return
    }
    setGeoStatus('loading') // Affiche le spinner GPS
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Succès : stocke les coordonnées dans le formulaire
        setForm((p) => ({
          ...p,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }))
        setGeoStatus('success')
      },
      (err) => {
        console.error('Géolocalisation refusée:', err)
        setGeoStatus('error')
      },
      { enableHighAccuracy: true, timeout: 10000 } // Haute précision, timeout 10s
    )
  }

  /**
   * handleAnalyseIA — Lance l'analyse IA de l'incident à partir de la photo
   */
  const handleAnalyseIA = async () => {
    if (!photo.file) return
    setAiLoading(true)
    try {
      // 🔧 BACKEND-INTEGRATION: Remplacer l'envoi de type/desc par le fichier image
      const result = await analyserIncident({ 
        type: form.type || 'Inconnu', 
        description: 'Analyse depuis la photo',
        // imageFile: photo.file 
      })
      setAiResult(result)
    } catch (e) { console.error(e) }
    finally { setAiLoading(false) }
  }

  /**
   * validate — Valide tous les champs obligatoires du formulaire
   */
  const validate = () => {
    const e = {}
    if (!form.titre.trim())       e.titre = 'Le titre est requis'
    if (!form.type)               e.type = 'Choisissez le type d\'incident'
    if (!form.commune)            e.commune = 'Choisissez la commune'
    if (!form.description.trim()) e.description = 'Décrivez l\'incident'
    else if (form.description.length < 20) e.description = 'Description trop courte (20 caractères min.)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /**
   * handleSubmit — Soumet le signalement à l'API
   * Note Backend: Utiliser FormData pour inclure le fichier image
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await createSignalement({
        ...form,
        lat: parseFloat(form.lat) || -4.3225,
        lng: parseFloat(form.lng) || 15.3222,
        gravite: aiResult?.gravite || 2,
        signalePar: user?.id,
        photo: photo.file?.name || null,
        iaAnalyse: aiResult?.analyse || '',
      })
      setSuccess(true)
      // Redirige vers la liste des signalements après 2 secondes
      setTimeout(() => navigate('/signalements'), 2000)
    } catch (e) { console.error(e) }
    finally { setSubmitting(false) }
  }

  // Écran de succès après soumission réussie
  if (success) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="text-center animate-fade-in-up">
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(39,174,96,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2.5rem' }}>✅</div>
          <h2 style={{ fontWeight: 800, color: 'var(--eco-text-primary)', marginBottom: 8 }}>Signalement envoyé !</h2>
          <p style={{ color: 'var(--eco-text-secondary)' }}>Votre incident a été transmis aux autorités compétentes. Vous allez être redirigé...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px' }}>
      {/* ---- EN-TÊTE ---- */}
      <div className="mb-4">
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--eco-text-primary)', marginBottom: 4 }}>
          <i className="bi bi-plus-circle-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>
          Nouveau Signalement
        </h1>
        <p style={{ color: 'var(--eco-text-secondary)', margin: 0, fontSize: '0.9rem' }}>
          Signalez un incident écologique dans votre commune de Kinshasa
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-4">

          {/* ==================== COLONNE PRINCIPALE ==================== */}
          <div className="col-lg-8">

            {/* ---- SECTION 1 : TYPE D'INCIDENT ---- */}
            <div className="eco-card p-4 mb-4">
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--eco-text-primary)', marginBottom: 16 }}>
                <span className="me-2">1️⃣</span> Type d'Incident
              </h4>
              {/* Grille de sélection du type d'incident */}
              <div className="row g-2 mb-3">
                {TYPES_INCIDENT.map((t) => (
                  <div key={t.value} className="col-6 col-sm-4">
                    <div
                      onClick={() => { handleChange({ target: { name: 'type', value: t.value } }); setAiResult(null) }}
                      style={{
                        padding: '12px 8px',
                        borderRadius: 10,
                        border: `2px solid ${form.type === t.value ? t.color : 'var(--eco-border)'}`,
                        background: form.type === t.value ? `${t.color}12` : 'var(--eco-bg-primary)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <i className={`bi ${t.icon} d-block mb-1`} style={{ color: t.color, fontSize: '1.3rem' }}></i>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--eco-text-primary)' }}>{t.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              {errors.type && <div style={{ color: '#e74c3c', fontSize: '0.78rem' }}><i className="bi bi-exclamation-circle me-1"></i>{errors.type}</div>}
            </div>

            {/* ---- SECTION 2 : INFORMATIONS DE L'INCIDENT ---- */}
            <div className="eco-card p-4 mb-4">
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--eco-text-primary)', marginBottom: 16 }}>
                <span className="me-2">2️⃣</span> Informations de l'Incident
              </h4>
              <div className="d-flex flex-column gap-3">
                {/* Titre de l'incident */}
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 6, color: 'var(--eco-text-primary)' }}>Titre court *</label>
                  <input name="titre" type="text" className={`eco-input ${errors.titre ? 'is-invalid' : ''}`} placeholder="Ex: Inondation avenue Victoire — Gombe" value={form.titre} onChange={handleChange} maxLength={80} />
                  {errors.titre && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: 4 }}>{errors.titre}</div>}
                </div>
                {/* Commune */}
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 6, color: 'var(--eco-text-primary)' }}>Commune *</label>
                  <select name="commune" className={`eco-input ${errors.commune ? 'is-invalid' : ''}`} value={form.commune} onChange={handleChange}>
                    <option value="">Sélectionnez la commune</option>
                    {COMMUNES_KINSHASA.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.commune && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: 4 }}>{errors.commune}</div>}
                </div>
                {/* Description */}
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 6, color: 'var(--eco-text-primary)' }}>Description détaillée *</label>
                  <textarea
                    name="description"
                    className={`eco-input ${errors.description ? 'is-invalid' : ''}`}
                    placeholder="Décrivez précisément l'incident : lieu exact, étendue, impact sur les habitants..."
                    value={form.description}
                    onChange={handleChange}
                    rows={5}
                    style={{ resize: 'vertical', minHeight: 120 }}
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--eco-text-secondary)', marginTop: 4, textAlign: 'right' }}>
                    {form.description.length} / 500 caractères
                  </div>
                  {errors.description && <div style={{ color: '#e74c3c', fontSize: '0.75rem' }}>{errors.description}</div>}
                </div>
              </div>
            </div>

            {/* ---- SECTION 3 : LOCALISATION GPS ---- */}
            <div className="eco-card p-4 mb-4">
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--eco-text-primary)', marginBottom: 16 }}>
                <span className="me-2">3️⃣</span> Localisation GPS
              </h4>
              {/* Bouton de géolocalisation native */}
              <button
                type="button"
                onClick={handleGeolocate}
                className="btn w-100 rounded-3 d-flex align-items-center justify-content-center gap-2 mb-3"
                style={{
                  padding: '14px',
                  border: `2px dashed ${geoStatus === 'success' ? '#27ae60' : geoStatus === 'error' ? '#e74c3c' : 'var(--eco-border)'}`,
                  background: geoStatus === 'success' ? 'rgba(39,174,96,0.06)' : 'var(--eco-bg-primary)',
                  color: 'var(--eco-text-primary)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
                disabled={geoStatus === 'loading'}
              >
                {geoStatus === 'loading' && <InlineLoader size="sm" />}
                {geoStatus === 'idle'    && <><i className="bi bi-geo-alt-fill" style={{ color: '#3498db' }}></i> Utiliser ma position GPS</>}
                {geoStatus === 'success' && <><i className="bi bi-check-circle-fill" style={{ color: '#27ae60' }}></i> Position capturée ✓</>}
                {geoStatus === 'error'   && <><i className="bi bi-exclamation-circle-fill" style={{ color: '#e74c3c' }}></i> GPS refusé — Saisissez manuellement</>}
                {geoStatus === 'loading' && 'Détection en cours...'}
              </button>
              {/* Coordonnées manuelles */}
              <div className="row g-2">
                <div className="col-6">
                  <label style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)', marginBottom: 4, display: 'block' }}>Latitude</label>
                  <input name="lat" type="number" step="0.000001" className="eco-input" placeholder="-4.3225" value={form.lat} onChange={handleChange} style={{ fontSize: '0.85rem' }} />
                </div>
                <div className="col-6">
                  <label style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)', marginBottom: 4, display: 'block' }}>Longitude</label>
                  <input name="lng" type="number" step="0.000001" className="eco-input" placeholder="15.3222" value={form.lng} onChange={handleChange} style={{ fontSize: '0.85rem' }} />
                </div>
              </div>
            </div>
          </div>

          {/* ==================== COLONNE DROITE ==================== */}
          <div className="col-lg-4">

            {/* ---- PHOTO DE L'INCIDENT ---- */}
            <div className="eco-card p-4 mb-4">
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--eco-text-primary)', marginBottom: 16 }}>
                📷 Photo de l'Incident
              </h4>
              {/* Zone de dépôt de fichier */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--eco-border)',
                  borderRadius: 12,
                  padding: 20,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--eco-bg-primary)',
                  minHeight: 140,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {photo.preview ? (
                  // Aperçu de la photo sélectionnée
                  <img src={photo.preview} alt="Aperçu" style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 160 }} />
                ) : (
                  // Message d'invitation au clic
                  <div>
                    <i className="bi bi-camera-fill d-block mb-2" style={{ fontSize: '2rem', color: 'var(--eco-text-secondary)' }}></i>
                    <div style={{ fontSize: '0.82rem', color: 'var(--eco-text-secondary)' }}>Cliquez pour ajouter une photo</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--eco-text-secondary)', opacity: 0.6 }}>JPG, PNG — Max 5 Mo</div>
                  </div>
                )}
              </div>
              {/* Input fichier caché (déclenché par le clic sur la zone) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
              {/* Bouton de changement de photo */}
              {photo.preview && (
                <button
                  type="button"
                  onClick={() => setPhoto({ file: null, preview: null })}
                  className="btn btn-sm btn-link mt-2 p-0"
                  style={{ color: '#e74c3c', fontSize: '0.78rem', textDecoration: 'none' }}
                >
                  <i className="bi bi-x-circle me-1"></i> Supprimer la photo
                </button>
              )}
            </div>

            {/* ---- ANALYSE IA ---- */}
            <div className="eco-card p-4 mb-4" style={{ border: '1px solid rgba(76,175,128,0.3)' }}>
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--eco-text-primary)', marginBottom: 12 }}>
                🤖 Analyse IA de l'image
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--eco-text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
                Notre modèle IA analysera votre photo pour estimer la gravité de l'incident et extraire le contexte.
              </p>
              <button
                type="button"
                onClick={handleAnalyseIA}
                className="btn w-100 rounded-3 d-flex align-items-center justify-content-center gap-2"
                style={{ border: '1.5px solid var(--eco-accent)', color: 'var(--eco-accent)', background: 'rgba(45,122,78,0.06)', fontSize: '0.85rem', padding: '10px', fontWeight: 600 }}
                disabled={aiLoading || !photo.file}
              >
                {aiLoading ? <><InlineLoader size="sm" /> Analyse de la photo en cours...</> : <><i className="bi bi-camera-fill"></i> Analyser l'image avec l'IA</>}
              </button>
              {/* Résultat de l'analyse IA */}
              {aiResult && (
                <div className="mt-3 p-3 rounded-3 animate-fade-in" style={{ background: 'rgba(45,122,78,0.07)', border: '1px solid rgba(45,122,78,0.2)' }}>
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--eco-text-primary)' }}>Gravité détectée</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--eco-text-secondary)' }}>Confiance: {aiResult.confiance}%</span>
                  </div>
                  {/* Indicateurs de gravité (5 points) */}
                  <div className="d-flex gap-1 mb-2">
                    {[1,2,3,4,5].map((n) => (
                      <div key={n} style={{ flex: 1, height: 8, borderRadius: 4, background: n <= aiResult.gravite ? (aiResult.gravite >= 4 ? '#e74c3c' : aiResult.gravite >= 3 ? '#e67e22' : '#27ae60') : 'var(--eco-border)' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)', margin: 0, lineHeight: 1.6 }}>{aiResult.analyse}</p>
                </div>
              )}
            </div>

            {/* ---- BOUTON DE SOUMISSION ---- */}
            <button
              id="btn-submit-signalement"
              type="submit"
              className="btn-eco btn w-100 rounded-3"
              style={{ padding: '15px', fontSize: '1rem' }}
              disabled={submitting}
            >
              {submitting
                ? <span className="d-flex align-items-center justify-content-center gap-2"><InlineLoader size="sm" /> Envoi en cours...</span>
                : <span><i className="bi bi-send-fill me-2"></i>Envoyer le Signalement</span>
              }
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default NewSignalement
