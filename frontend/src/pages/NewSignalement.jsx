// =============================================================
// src/pages/NewSignalement.jsx - Formulaire citoyen de signalement.
// Donnees de reference, photo, adresse exacte, GPS et pre-analyse IA
// passent par les API officielles du backend.
// =============================================================
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyserIncident } from '../api/aiApi'
import { createSignalement, getCommunes, getTypesIncident } from '../api/signalementApi'
import { InlineLoader } from '../components/Loader'
import { useAuth } from '../context/AuthContext'

const NewSignalement = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  // Etat principal du formulaire. Les identifiants commune/province viennent
  // du backend afin que le signalement soit directement exploitable par MySQL.
  const [form, setForm] = useState({
    titre: '',
    type: '',
    communeId: user?.commune_id || '',
    description: '',
    addressText: user?.address_line || '',
    lat: '',
    lng: '',
  })
  const [photo, setPhoto] = useState({ file: null, preview: null })
  const [errors, setErrors] = useState({})
  const [geoStatus, setGeoStatus] = useState('idle')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [communes, setCommunes] = useState([])
  const [typesIncident, setTypesIncident] = useState([])

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [communeRows, categoryRows] = await Promise.all([getCommunes(), getTypesIncident()])
        setCommunes(communeRows)
        setTypesIncident(categoryRows)
        if (!form.communeId && user?.commune) {
          const current = communeRows.find((item) => item.name === user.commune)
          if (current) setForm((previous) => ({ ...previous, communeId: current.id }))
        }
      } catch (error) {
        console.error('Chargement des references impossible :', error)
      }
    }
    loadReferences()
  }, [user?.commune])

  const selectedCommune = communes.find((item) => String(item.id) === String(form.communeId))
  const selectedCategory = typesIncident.find((item) => item.value === form.type)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    if (errors[name]) setErrors((previous) => ({ ...previous, [name]: '' }))
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto({ file, preview: reader.result })
    reader.readAsDataURL(file)
    setAiResult(null)
    runImageAnalysis(file)
    setErrors((previous) => ({ ...previous, photo: '' }))
  }

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error')
      return
    }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((previous) => ({
          ...previous,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        }))
        setGeoStatus('success')
      },
      (error) => {
        console.error('Geolocalisation refusee :', error)
        setGeoStatus('error')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const runImageAnalysis = async (file = photo.file) => {
    if (!file) return
    setAiLoading(true)
    setSubmitError('')
    try {
      const result = await analyserIncident({
        type: form.type || 'incident-environnemental',
        description: form.description || 'Analyse depuis la photo',
        commune: selectedCommune?.name,
        lat: form.lat,
        lng: form.lng,
        imageFile: file,
      })
      setAiResult(result)
    } catch (error) {
      console.error(error)
      setSubmitError("L'analyse IA n'a pas pu etre lancee pour le moment.")
    } finally {
      setAiLoading(false)
    }
  }

  const handleAnalyseIA = async () => {
    runImageAnalysis(photo.file)
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.titre.trim()) nextErrors.titre = 'Le titre est requis.'
    if (!form.type) nextErrors.type = "Choisissez le type d'incident."
    if (!form.communeId) nextErrors.communeId = 'Choisissez la commune.'
    if (!form.addressText.trim()) nextErrors.addressText = 'Ajoutez une adresse exacte ou un repere.'
    if (!form.description.trim()) nextErrors.description = "Decrivez l'incident."
    else if (form.description.trim().length < 20) nextErrors.description = 'La description doit contenir au moins 20 caracteres.'
    if (!photo.file) nextErrors.photo = "Ajoutez une photo pour documenter l'incident."
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await createSignalement({
        ...form,
        communeId: selectedCommune?.id,
        provinceId: selectedCommune?.province,
        categoryId: selectedCategory?.id,
        addressText: form.addressText,
        lat: parseFloat(form.lat) || selectedCommune?.lat || -4.3225,
        lng: parseFloat(form.lng) || selectedCommune?.lng || 15.3222,
        photoFile: photo.file,
        iaAnalyse: aiResult?.analyse || '',
      })
      setSuccess(true)
      setTimeout(() => navigate('/signalements'), 1600)
    } catch (error) {
      console.error(error)
      const data = error.response?.data
      const detail = data?.detail || (data && Object.values(data).flat().join(' ')) || error.message
      setSubmitError(detail || "Le signalement n'a pas pu etre envoye.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="text-center animate-fade-in-up">
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(39,174,96,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2.3rem', color: '#27ae60' }}>
            <i className="bi bi-check2-circle"></i>
          </div>
          <h2 style={{ fontWeight: 800, color: 'var(--eco-text-primary)', marginBottom: 8 }}>Signalement envoye</h2>
          <p style={{ color: 'var(--eco-text-secondary)' }}>Votre dossier a ete transmis aux acteurs competents.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}>
      <div className="mb-4">
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--eco-text-primary)', marginBottom: 4 }}>
          <i className="bi bi-plus-circle-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>
          Nouveau signalement
        </h1>
        <p style={{ color: 'var(--eco-text-secondary)', margin: 0, fontSize: '0.9rem' }}>
          Signalez un incident environnemental avec photo, adresse exacte et localisation.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-4">
          <div className="col-lg-8">
            <section className="eco-card p-4 mb-4">
              <h2 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--eco-text-primary)', marginBottom: 16 }}>
                <i className="bi bi-tags-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>Type d'incident
              </h2>
              <div className="row g-2 mb-3">
                {typesIncident.map((type) => (
                  <div key={type.value} className="col-6 col-sm-4">
                    <button
                      type="button"
                      onClick={() => { setForm((previous) => ({ ...previous, type: type.value })); setAiResult(null) }}
                      style={{
                        width: '100%',
                        padding: '12px 8px',
                        borderRadius: 8,
                        border: `2px solid ${form.type === type.value ? type.color : 'var(--eco-border)'}`,
                        background: form.type === type.value ? `${type.color}12` : 'var(--eco-bg-primary)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <i className={`bi ${type.icon} d-block mb-1`} style={{ color: type.color, fontSize: '1.25rem' }}></i>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--eco-text-primary)' }}>{type.label}</span>
                    </button>
                  </div>
                ))}
              </div>
              {errors.type && <div style={{ color: '#e74c3c', fontSize: '0.78rem' }}>{errors.type}</div>}
            </section>

            <section className="eco-card p-4 mb-4">
              <h2 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--eco-text-primary)', marginBottom: 16 }}>
                <i className="bi bi-card-text me-2" style={{ color: 'var(--eco-accent)' }}></i>Informations du dossier
              </h2>
              <div className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label fw-semibold">Titre court</label>
                  <input name="titre" type="text" className={`eco-input ${errors.titre ? 'is-invalid' : ''}`} placeholder="Ex: Inondation avenue Victoire, Gombe" value={form.titre} onChange={handleChange} maxLength={100} />
                  {errors.titre && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: 4 }}>{errors.titre}</div>}
                </div>

                <div>
                  <label className="form-label fw-semibold">Commune</label>
                  <select name="communeId" className={`eco-input ${errors.communeId ? 'is-invalid' : ''}`} value={form.communeId} onChange={handleChange}>
                    <option value="">Selectionnez la commune</option>
                    {communes.map((commune) => <option key={commune.id} value={commune.id}>{commune.name}</option>)}
                  </select>
                  {errors.communeId && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: 4 }}>{errors.communeId}</div>}
                </div>

                <div>
                  <label className="form-label fw-semibold">Adresse exacte ou repere</label>
                  <input
                    name="addressText"
                    type="text"
                    className={`eco-input ${errors.addressText ? 'is-invalid' : ''}`}
                    placeholder="Avenue, quartier, numero, reference proche"
                    value={form.addressText}
                    onChange={handleChange}
                    maxLength={220}
                  />
                  {errors.addressText && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: 4 }}>{errors.addressText}</div>}
                </div>

                <div>
                  <label className="form-label fw-semibold">Description detaillee</label>
                  <textarea
                    name="description"
                    className={`eco-input ${errors.description ? 'is-invalid' : ''}`}
                    placeholder="Precisez le lieu, l'etendue, les risques visibles, les habitants touches et l'urgence."
                    value={form.description}
                    onChange={handleChange}
                    rows={5}
                    style={{ resize: 'vertical', minHeight: 120 }}
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--eco-text-secondary)', marginTop: 4, textAlign: 'right' }}>{form.description.length} caracteres</div>
                  {errors.description && <div style={{ color: '#e74c3c', fontSize: '0.75rem' }}>{errors.description}</div>}
                </div>
              </div>
            </section>

            <section className="eco-card p-4 mb-4">
              <h2 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--eco-text-primary)', marginBottom: 16 }}>
                <i className="bi bi-geo-alt-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>Localisation
              </h2>
              <button
                type="button"
                onClick={handleGeolocate}
                className="btn w-100 rounded-3 d-flex align-items-center justify-content-center gap-2 mb-3"
                style={{
                  padding: 14,
                  border: `2px dashed ${geoStatus === 'success' ? '#27ae60' : geoStatus === 'error' ? '#e74c3c' : 'var(--eco-border)'}`,
                  background: geoStatus === 'success' ? 'rgba(39,174,96,0.06)' : 'var(--eco-bg-primary)',
                  color: 'var(--eco-text-primary)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                }}
                disabled={geoStatus === 'loading'}
              >
                {geoStatus === 'loading' && <InlineLoader size="sm" />}
                {geoStatus === 'idle' && <><i className="bi bi-crosshair" style={{ color: '#3498db' }}></i>Utiliser ma position GPS</>}
                {geoStatus === 'success' && <><i className="bi bi-check-circle-fill" style={{ color: '#27ae60' }}></i>Position capturee</>}
                {geoStatus === 'error' && <><i className="bi bi-exclamation-circle-fill" style={{ color: '#e74c3c' }}></i>Saisissez les coordonnees manuellement</>}
                {geoStatus === 'loading' && 'Detection en cours...'}
              </button>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small text-muted">Latitude</label>
                  <input name="lat" type="number" step="0.000001" className="eco-input" placeholder="-4.3225" value={form.lat} onChange={handleChange} />
                </div>
                <div className="col-6">
                  <label className="form-label small text-muted">Longitude</label>
                  <input name="lng" type="number" step="0.000001" className="eco-input" placeholder="15.3222" value={form.lng} onChange={handleChange} />
                </div>
              </div>
            </section>
          </div>

          <div className="col-lg-4">
            <section className="eco-card p-4 mb-4">
              <h2 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--eco-text-primary)', marginBottom: 16 }}>
                <i className="bi bi-camera-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>Photo du terrain
              </h2>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--eco-border)',
                  borderRadius: 8,
                  padding: 20,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--eco-bg-primary)',
                  minHeight: 150,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {photo.preview ? (
                  <img src={photo.preview} alt="Apercu du signalement" style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 180 }} />
                ) : (
                  <div>
                    <i className="bi bi-camera-fill d-block mb-2" style={{ fontSize: '2rem', color: 'var(--eco-text-secondary)' }}></i>
                    <div style={{ fontSize: '0.84rem', color: 'var(--eco-text-secondary)' }}>Cliquez pour ajouter une photo</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--eco-text-secondary)', opacity: 0.7 }}>JPG, PNG ou WEBP</div>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
              {photo.preview && (
                <button type="button" onClick={() => { setPhoto({ file: null, preview: null }); setAiResult(null) }} className="btn btn-sm btn-link mt-2 p-0" style={{ color: '#e74c3c', fontSize: '0.78rem', textDecoration: 'none' }}>
                  <i className="bi bi-x-circle me-1"></i>Supprimer la photo
                </button>
              )}
              {errors.photo && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: 8 }}>{errors.photo}</div>}
            </section>

            <section className="eco-card p-4 mb-4" style={{ border: '1px solid rgba(76,175,128,0.3)' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--eco-text-primary)', marginBottom: 12 }}>
                <i className="bi bi-cpu-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>Analyse IA image
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--eco-text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
                L'agent IA analyse automatiquement la photo apres upload. Vous pouvez relancer l'analyse si vous changez les informations.
              </p>
              <button
                type="button"
                onClick={handleAnalyseIA}
                className="btn w-100 rounded-3 d-flex align-items-center justify-content-center gap-2"
                style={{ border: '1.5px solid var(--eco-accent)', color: 'var(--eco-accent)', background: 'rgba(45,122,78,0.06)', fontSize: '0.85rem', padding: 10, fontWeight: 700 }}
                disabled={aiLoading || !photo.file}
              >
                {aiLoading ? <><InlineLoader size="sm" />Analyse en cours...</> : aiResult ? <><i className="bi bi-arrow-clockwise"></i>Relancer l'analyse</> : <><i className="bi bi-camera-fill"></i>Analyser l'image</>}
              </button>
              {aiResult && (
                <div className="mt-3 p-3 rounded-3 animate-fade-in" style={{ background: 'rgba(45,122,78,0.07)', border: '1px solid rgba(45,122,78,0.2)' }}>
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--eco-text-primary)' }}>Gravite detectee</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--eco-text-secondary)' }}>Confiance: {aiResult.confiance || 0}%</span>
                  </div>
                  <div className="d-flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div key={level} style={{ flex: 1, height: 8, borderRadius: 4, background: level <= aiResult.gravite ? (aiResult.gravite >= 4 ? '#e74c3c' : aiResult.gravite >= 3 ? '#e67e22' : '#27ae60') : 'var(--eco-border)' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--eco-text-secondary)', margin: 0, lineHeight: 1.6 }}>{aiResult.analyse}</p>
                  {aiResult.providerSource && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--eco-text-secondary)', marginTop: 8 }}>
                      Source IA: {aiResult.providerSource}{aiResult.model ? ` - ${aiResult.model}` : ''}
                    </div>
                  )}
                </div>
              )}
            </section>

            {submitError && (
              <div className="mb-3" style={{ color: '#e74c3c', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: 8, padding: '10px 12px', fontSize: '0.84rem' }}>
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{submitError}
              </div>
            )}

            <button id="btn-submit-signalement" type="submit" className="btn-eco btn w-100 rounded-3" style={{ padding: 15, fontSize: '1rem' }} disabled={submitting}>
              {submitting
                ? <span className="d-flex align-items-center justify-content-center gap-2"><InlineLoader size="sm" />Envoi en cours...</span>
                : <span><i className="bi bi-send-fill me-2"></i>Envoyer le signalement</span>
              }
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default NewSignalement
