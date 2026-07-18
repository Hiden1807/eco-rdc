// =============================================================
// src/pages/Publications.jsx - Publications publiques et console
// officielle. La page lit les contenus depuis l'API Django et
// affiche un detail complet sans quitter la plateforme.
// =============================================================
import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createPublication, getPublications } from '../api/publicationApi'
import Loader from '../components/Loader'
import { useAuth } from '../context/AuthContext'

const initialForm = {
  title: '',
  publication_type: 'actualite',
  excerpt: '',
  body: '',
  scope_label: 'Kinshasa',
  status: 'published',
  is_public: true,
  is_featured: false,
  video_url: '',
  cover_image: null,
  attachment_pdf: null,
  video_file: null,
}

const publicationTypes = [
  { value: 'actualite', label: 'Actualite', icon: 'bi-newspaper' },
  { value: 'education', label: 'Education', icon: 'bi-mortarboard-fill' },
  { value: 'communique', label: 'Communique officiel', icon: 'bi-megaphone-fill' },
  { value: 'rapport-public', label: 'Mise a disposition', icon: 'bi-file-earmark-text-fill' },
  { value: 'campagne', label: 'Campagne', icon: 'bi-broadcast-pin' },
]

const formatDate = (value) => {
  if (!value) return 'Publication officielle'
  return new Intl.DateTimeFormat('fr-CD', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value))
}

const Publications = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [filter, setFilter] = useState('tout')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const canPublish = ['autorite', 'ministere', 'admin'].includes(user?.role)

  const refresh = async () => {
    const data = await getPublications()
    setItems(data)
    const requestedPublication = searchParams.get('publication')
    if (requestedPublication) {
      const found = data.find((item) => String(item.id) === String(requestedPublication))
      if (found) setSelected(found)
    }
    setLoading(false)
  }

  useEffect(() => { refresh() }, [searchParams])

  const filteredItems = useMemo(() => (
    filter === 'tout' ? items : items.filter((item) => item.publication_type === filter)
  ), [filter, items])

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createPublication({ ...form, slug: '' })
      setForm(initialForm)
      event.currentTarget.reset()
      await refresh()
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.publication_type || err.message
      setError(Array.isArray(detail) ? detail.join(' ') : detail || 'Publication impossible.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader message="Chargement des publications..." />

  if (selected) {
    return (
      <main style={{ maxWidth: 1020, margin: '0 auto', padding: 24 }}>
        <button type="button" className="btn btn-link p-0 mb-4" onClick={() => setSelected(null)}>
          <i className="bi bi-arrow-left me-2"></i>Retour aux publications
        </button>

        <article className="eco-card" style={{ overflow: 'hidden' }}>
          {selected.cover_image && (
            <img
              src={selected.cover_image}
              alt={selected.title}
              style={{ width: '100%', maxHeight: 430, objectFit: 'cover', display: 'block' }}
            />
          )}
          <div className="p-4 p-md-5">
            <div className="d-flex gap-2 flex-wrap align-items-center mb-3">
              <span className="badge text-bg-success text-uppercase">{selected.publication_type}</span>
              <span style={{ color: 'var(--eco-text-secondary)', fontSize: '0.88rem' }}>
                {selected.scope_label || selected.commune_name || 'RDC'} - {formatDate(selected.published_at || selected.created_at)}
              </span>
            </div>
            <h1 style={{ fontWeight: 850, color: 'var(--eco-text-primary)', lineHeight: 1.15 }}>{selected.title}</h1>
            <p style={{ color: 'var(--eco-text-secondary)', fontSize: '1.05rem', lineHeight: 1.7 }}>{selected.excerpt}</p>
            <div style={{ whiteSpace: 'pre-line', lineHeight: 1.85, color: 'var(--eco-text-primary)' }}>
              {selected.body || selected.excerpt}
            </div>

            {selected.video_file && (
              <video controls style={{ width: '100%', borderRadius: 8, marginTop: 28, background: '#000' }}>
                <source src={selected.video_file} />
              </video>
            )}

            <div className="d-flex gap-2 flex-wrap mt-4">
              {selected.attachment_pdf && (
                <a className="btn-eco btn" href={selected.attachment_pdf} target="_blank" rel="noreferrer">
                  <i className="bi bi-file-earmark-pdf-fill me-2"></i>Ouvrir le PDF
                </a>
              )}
              {selected.video_url && (
                <a className="btn btn-outline-success" href={selected.video_url} target="_blank" rel="noreferrer">
                  <i className="bi bi-play-circle-fill me-2"></i>Ouvrir la video externe
                </a>
              )}
            </div>
          </div>
        </article>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: 24 }}>
      <header className="mb-4" style={{ display: 'grid', gap: 18 }}>
        <div>
          <span className="badge text-bg-success mb-3">Information institutionnelle</span>
          <h1 style={{ fontWeight: 850, color: 'var(--eco-text-primary)', marginBottom: 8 }}>
            Publications officielles ECO RDC
          </h1>
          <p style={{ color: 'var(--eco-text-secondary)', margin: 0, maxWidth: 760, lineHeight: 1.7 }}>
            Actualites, communiques, education environnementale, campagnes et documents publics publies par les acteurs habilites.
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <button className={`btn rounded-pill ${filter === 'tout' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setFilter('tout')}>Tout</button>
          {publicationTypes.map((type) => (
            <button key={type.value} className={`btn rounded-pill ${filter === type.value ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setFilter(type.value)}>
              <i className={`bi ${type.icon} me-2`}></i>{type.label}
            </button>
          ))}
        </div>
      </header>

      {canPublish && (
        <form className="eco-card p-4 my-4" onSubmit={submit}>
          <div className="d-flex align-items-center gap-3 mb-4">
            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(45,122,78,0.12)', color: 'var(--eco-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-megaphone-fill"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Nouvelle publication</h2>
              <p style={{ margin: 0, color: 'var(--eco-text-secondary)', fontSize: '0.82rem' }}>
                Images, PDF et videos locales sont envoyes au backend et conserves en base avec leurs fichiers.
              </p>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-lg-8">
              <label className="form-label fw-semibold">Titre</label>
              <input className="eco-input" value={form.title} onChange={(event) => update('title', event.target.value)} required />
            </div>
            <div className="col-lg-4">
              <label className="form-label fw-semibold">Type</label>
              <select className="eco-input" value={form.publication_type} onChange={(event) => update('publication_type', event.target.value)}>
                {publicationTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Portee</label>
              <input className="eco-input" value={form.scope_label} onChange={(event) => update('scope_label', event.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Statut</label>
              <select className="eco-input" value={form.status} onChange={(event) => update('status', event.target.value)}>
                <option value="published">Publie</option>
                <option value="draft">Brouillon</option>
                <option value="archived">Archive</option>
              </select>
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Resume public</label>
              <textarea className="eco-input" rows={2} value={form.excerpt} onChange={(event) => update('excerpt', event.target.value)} required />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold">Contenu complet</label>
              <textarea className="eco-input" rows={7} value={form.body} onChange={(event) => update('body', event.target.value)} />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Image</label>
              <input className="eco-input" type="file" accept="image/*" onChange={(event) => update('cover_image', event.target.files?.[0] || null)} />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">PDF</label>
              <input className="eco-input" type="file" accept="application/pdf" onChange={(event) => update('attachment_pdf', event.target.files?.[0] || null)} />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Video locale</label>
              <input className="eco-input" type="file" accept="video/*" onChange={(event) => update('video_file', event.target.files?.[0] || null)} />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Lien video</label>
              <input className="eco-input" type="url" placeholder="https://..." value={form.video_url} onChange={(event) => update('video_url', event.target.value)} />
            </div>

            <div className="col-12 d-flex gap-3 flex-wrap">
              <label className="d-flex align-items-center gap-2" style={{ color: 'var(--eco-text-secondary)', fontSize: '0.86rem' }}>
                <input type="checkbox" checked={form.is_public} onChange={(event) => update('is_public', event.target.checked)} />
                Visible au public
              </label>
              <label className="d-flex align-items-center gap-2" style={{ color: 'var(--eco-text-secondary)', fontSize: '0.86rem' }}>
                <input type="checkbox" checked={form.is_featured} onChange={(event) => update('is_featured', event.target.checked)} />
                Mettre en avant
              </label>
            </div>

            {error && (
              <div className="col-12">
                <div style={{ color: '#e74c3c', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: 8, padding: '10px 12px', fontSize: '0.85rem' }}>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
                </div>
              </div>
            )}

            <div className="col-12 d-flex gap-2 flex-wrap">
              <button className="btn-eco btn" disabled={saving}>
                <i className="bi bi-send-fill me-2"></i>{saving ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </div>
        </form>
      )}

      <section className="row g-3">
        {filteredItems.map((item) => (
          <div className="col-md-6 col-xl-4" key={item.id}>
            <article
              className="eco-card h-100"
              onClick={() => setSelected(item)}
              style={{ cursor: 'pointer', overflow: 'hidden', transition: 'transform 0.18s ease, box-shadow 0.18s ease' }}
              onMouseEnter={(event) => { event.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={(event) => { event.currentTarget.style.transform = 'translateY(0)' }}
            >
              {item.cover_image ? (
                <img src={item.cover_image} alt={item.title} style={{ width: '100%', height: 190, objectFit: 'cover' }} />
              ) : (
                <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(45,122,78,0.08)', color: 'var(--eco-accent)' }}>
                  <i className="bi bi-file-earmark-text-fill" style={{ fontSize: '2rem' }}></i>
                </div>
              )}
              <div className="p-4">
                <small style={{ color: 'var(--eco-accent)', fontWeight: 800, textTransform: 'uppercase' }}>
                  {item.publication_type} - {item.scope_label || 'RDC'}
                </small>
                <h3 style={{ fontSize: '1.08rem', fontWeight: 800, marginTop: 8, color: 'var(--eco-text-primary)' }}>{item.title}</h3>
                <p style={{ color: 'var(--eco-text-secondary)' }}>{item.excerpt}</p>
                <div className="d-flex gap-2 flex-wrap mt-3">
                  {item.attachment_pdf && <span className="badge text-bg-light"><i className="bi bi-file-earmark-pdf-fill me-1"></i>PDF</span>}
                  {(item.video_url || item.video_file) && <span className="badge text-bg-light"><i className="bi bi-play-circle-fill me-1"></i>Video</span>}
                  <span className="badge text-bg-light"><i className="bi bi-eye-fill me-1"></i>Lire</span>
                </div>
              </div>
            </article>
          </div>
        ))}
        {!filteredItems.length && (
          <div className="col-12">
            <div className="eco-card p-5 text-center" style={{ color: 'var(--eco-text-secondary)' }}>
              Aucune publication disponible pour cette categorie.
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default Publications
