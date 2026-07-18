// =============================================================
// src/pages/Education.jsx - Centre public d'education environnementale
// Les contenus proviennent des endpoints education/ et publications/.
// =============================================================
import React, { useEffect, useState } from 'react'
import { generateEducationContent } from '../api/aiApi'
import { getEducationContents } from '../api/educationApi'
import { getPublications } from '../api/publicationApi'
import Loader from '../components/Loader'
import { useAuth } from '../context/AuthContext'

const Education = () => {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [topic, setTopic] = useState('Tout')
  const [loading, setLoading] = useState(true)
  const [aiSaving, setAiSaving] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [aiForm, setAiForm] = useState({ theme: 'dechets et salubrite publique', public_cible: 'citoyens', niveau: 'simple' })

  const canGenerate = ['autorite', 'ministere', 'admin'].includes(user?.role)

  const refresh = () => {
    Promise.all([
      getEducationContents(),
      getPublications({ publication_type: 'education' }),
    ])
      .then(([education, publications]) => {
        const fromPublications = publications.map((item) => ({
          id: `pub-${item.id}`,
          title: item.title,
          topic: item.publication_type,
          excerpt: item.excerpt,
          body: item.body,
          content_type: item.publication_type,
          image: item.cover_image,
          pdf_file: item.attachment_pdf,
          video_file: item.video_file,
          video_url: item.video_url,
          is_official: true,
        }))
        setItems([...education, ...fromPublications])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [])

  const submitAIGeneration = async (event) => {
    event.preventDefault()
    setAiSaving(true)
    setAiMessage('')
    try {
      await generateEducationContent(aiForm)
      setAiMessage('Brouillon educatif genere par ECO IA. Il attend validation avant publication.')
      refresh()
    } catch (error) {
      setAiMessage(error.response?.data?.detail || error.message || 'Generation impossible.')
    } finally {
      setAiSaving(false)
    }
  }

  const topics = ['Tout', ...new Set(items.map((item) => item.topic || item.content_type || 'General'))]
  const filtered = topic === 'Tout' ? items : items.filter((item) => (item.topic || item.content_type) === topic)

  if (loading) return <Loader message="Chargement des contenus educatifs..." />

  if (selected) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
        <button className="btn btn-link p-0 mb-4" onClick={() => setSelected(null)}>
          <i className="bi bi-arrow-left me-2"></i>Retour aux contenus
        </button>
        <article className="eco-card p-4 p-md-5">
          {selected.image && (
            <img src={selected.image} alt={selected.title} style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 8, marginBottom: 24 }} />
          )}
          <small style={{ color: 'var(--eco-accent)', fontWeight: 800, textTransform: 'uppercase' }}>
            {selected.topic || selected.content_type}
          </small>
          <h1 style={{ fontWeight: 800, marginTop: 8 }}>{selected.title}</h1>
          <p style={{ color: 'var(--eco-text-secondary)', fontSize: '1.05rem' }}>{selected.excerpt}</p>
          <div style={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>{selected.body}</div>
          {selected.video_file && (
            <video controls style={{ width: '100%', borderRadius: 8, marginTop: 24, background: '#000' }}>
              <source src={selected.video_file} />
            </video>
          )}
          <div className="d-flex gap-2 flex-wrap mt-4">
            {selected.pdf_file && <a className="btn-eco btn" href={selected.pdf_file} target="_blank" rel="noreferrer"><i className="bi bi-file-earmark-pdf-fill me-2"></i>Telecharger le PDF</a>}
            {selected.video_url && <a className="btn btn-outline-success" href={selected.video_url} target="_blank" rel="noreferrer"><i className="bi bi-play-circle-fill me-2"></i>Voir la video</a>}
          </div>
        </article>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <section className="p-5 mb-4 text-center" style={{ background: 'var(--eco-accent-gradient)', borderRadius: 8 }}>
        <h1 style={{ color: '#fff', fontWeight: 800 }}>Centre d'education environnementale</h1>
        <p style={{ color: 'rgba(255,255,255,0.88)', maxWidth: 620, margin: '12px auto 0' }}>
          Guides, conseils, campagnes, videos et documents publies depuis l'administration.
        </p>
      </section>

      {canGenerate && (
        <form className="eco-card p-4 mb-4" onSubmit={submitAIGeneration}>
          <div className="d-flex align-items-center gap-3 mb-3">
            <div style={{ width: 42, height: 42, borderRadius: 8, background: 'rgba(45,122,78,0.12)', color: 'var(--eco-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-cpu-fill"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Generer un brouillon educatif avec ECO IA</h2>
              <p style={{ margin: 0, color: 'var(--eco-text-secondary)', fontSize: '0.82rem' }}>Le contenu reste en brouillon jusqu'a validation officielle.</p>
            </div>
          </div>
          <div className="row g-2">
            <div className="col-lg-5">
              <input className="eco-input" value={aiForm.theme} onChange={(event) => setAiForm((current) => ({ ...current, theme: event.target.value }))} placeholder="Theme" required />
            </div>
            <div className="col-sm-4 col-lg-3">
              <select className="eco-input" value={aiForm.public_cible} onChange={(event) => setAiForm((current) => ({ ...current, public_cible: event.target.value }))}>
                <option value="citoyens">Citoyens</option>
                <option value="ecoles">Ecoles</option>
                <option value="autorites">Autorites</option>
              </select>
            </div>
            <div className="col-sm-4 col-lg-2">
              <select className="eco-input" value={aiForm.niveau} onChange={(event) => setAiForm((current) => ({ ...current, niveau: event.target.value }))}>
                <option value="simple">Simple</option>
                <option value="moyen">Moyen</option>
                <option value="avance">Avance</option>
              </select>
            </div>
            <div className="col-sm-4 col-lg-2">
              <button className="btn-eco btn w-100" disabled={aiSaving}>
                <i className="bi bi-magic me-2"></i>{aiSaving ? 'Generation...' : 'Generer'}
              </button>
            </div>
          </div>
          {aiMessage && <div className="mt-3" style={{ color: aiMessage.includes('impossible') ? '#e74c3c' : '#237a4d', fontSize: '0.86rem' }}>{aiMessage}</div>}
        </form>
      )}

      <div className="d-flex gap-2 mb-4 flex-wrap">
        {topics.map((item) => (
          <button key={item} className={`btn rounded-pill ${topic === item ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setTopic(item)}>
            {item}
          </button>
        ))}
      </div>

      <div className="row g-4">
        {filtered.map((item) => (
          <div className="col-md-6 col-lg-4" key={item.id}>
            <article className="eco-card p-4 h-100" onClick={() => setSelected(item)} style={{ cursor: 'pointer' }}>
              {item.image ? (
                <img src={item.image} alt={item.title} style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, marginBottom: 14 }} />
              ) : (
                <i className="bi bi-book-fill" style={{ fontSize: '1.8rem', color: 'var(--eco-accent)' }}></i>
              )}
              <small className="d-block mt-3" style={{ color: 'var(--eco-accent)', fontWeight: 800, textTransform: 'uppercase' }}>
                {item.topic || item.content_type}
              </small>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{item.title}</h2>
              <p style={{ color: 'var(--eco-text-secondary)' }}>{item.excerpt}</p>
              <div className="d-flex gap-2 flex-wrap">
                {item.pdf_file && <span className="badge text-bg-light"><i className="bi bi-file-earmark-pdf-fill me-1"></i>PDF</span>}
                {(item.video_url || item.video_file) && <span className="badge text-bg-light"><i className="bi bi-play-circle-fill me-1"></i>Video</span>}
              </div>
            </article>
          </div>
        ))}
        {!filtered.length && <div className="eco-card p-5 text-center">Aucun contenu publie pour le moment.</div>}
      </div>
    </div>
  )
}

export default Education
