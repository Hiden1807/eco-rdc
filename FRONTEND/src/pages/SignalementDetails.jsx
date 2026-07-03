// =============================================================
// src/pages/SignalementDetails.jsx — Fiche technique complète d'un incident
// Description, photo, coordonnées GPS, gravité IA, fil de commentaires
// =============================================================
import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSignalementById, addCommentaire, updateStatut, TYPES_INCIDENT } from '../api/signalementApi'
import Loader from '../components/Loader'
import { InlineLoader } from '../components/Loader'

const STATUTS = {
  nouveau:       { label: 'Nouveau', color: '#3498db', bg: 'rgba(52,152,219,0.12)' },
  en_traitement: { label: 'En Traitement', color: '#e67e22', bg: 'rgba(230,126,34,0.12)' },
  resolu:        { label: 'Résolu', color: '#27ae60', bg: 'rgba(39,174,96,0.12)' },
  rejete:        { label: 'Rejeté', color: '#e74c3c', bg: 'rgba(231,76,60,0.12)' },
}

const SignalementDetails = () => {
  // Récupère l'ID de l'URL via React Router
  const { id } = useParams()
  const { user } = useAuth()

  // État du signalement chargé
  const [signalement, setSignalement] = useState(null)
  const [loading, setLoading] = useState(true)
  // Texte du nouveau commentaire saisi
  const [newComment, setNewComment] = useState('')
  // État de soumission du commentaire
  const [commentLoading, setCommentLoading] = useState(false)
  // État de mise à jour du statut (pour les autorités)
  const [statutLoading, setStatutLoading] = useState(false)

  // Charge les données du signalement au montage
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getSignalementById(id)
        setSignalement(data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetch()
  }, [id])

  /**
   * handleAddComment — Ajoute un commentaire au fil de discussion
   */
  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setCommentLoading(true)
    try {
      const comment = await addCommentaire(signalement.id, newComment, user?.name)
      // Ajoute le commentaire localement sans recharger
      setSignalement((p) => ({ ...p, commentaires: [...p.commentaires, comment] }))
      setNewComment('') // Vide le champ
    } catch (e) { console.error(e) }
    finally { setCommentLoading(false) }
  }

  /**
   * handleUpdateStatut — Change le statut du signalement (autorités uniquement)
   */
  const handleUpdateStatut = async (nouveauStatut) => {
    setStatutLoading(true)
    try {
      await updateStatut(signalement.id, nouveauStatut)
      setSignalement((p) => ({ ...p, statut: nouveauStatut }))
    } catch (e) { console.error(e) }
    finally { setStatutLoading(false) }
  }

  if (loading) return <Loader message="Chargement de la fiche incident..." />
  if (!signalement) return <div className="text-center p-5">Signalement introuvable.</div>

  const typeInfo = TYPES_INCIDENT.find((t) => t.value === signalement.type) || {}
  const statutInfo = STATUTS[signalement.statut] || STATUTS.nouveau

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>

      {/* ---- FIL D'ARIANE ---- */}
      <div className="d-flex align-items-center gap-2 mb-4" style={{ fontSize: '0.82rem', color: 'var(--eco-text-secondary)' }}>
        <Link to="/signalements" style={{ color: 'var(--eco-accent)', textDecoration: 'none' }}>Mes Signalements</Link>
        <i className="bi bi-chevron-right"></i>
        <span>{signalement.titre}</span>
      </div>

      <div className="row g-4">

        {/* ==================== COLONNE PRINCIPALE ==================== */}
        <div className="col-lg-8">

          {/* ---- EN-TÊTE DE LA FICHE ---- */}
          <div className="eco-card p-4 mb-4">
            <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
              <div style={{ flex: 1 }}>
                {/* Type et commune */}
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className={`bi ${typeInfo.icon}`} style={{ color: typeInfo.color, fontSize: '1.1rem' }}></i>
                  <span style={{ color: typeInfo.color, fontSize: '0.82rem', fontWeight: 700 }}>{typeInfo.label}</span>
                  <span style={{ color: 'var(--eco-text-secondary)', fontSize: '0.75rem' }}>•</span>
                  <span style={{ color: 'var(--eco-text-secondary)', fontSize: '0.82rem' }}>
                    <i className="bi bi-geo-alt me-1"></i>{signalement.commune}
                  </span>
                </div>
                {/* Titre principal */}
                <h1 style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--eco-text-primary)', margin: '0 0 8px' }}>
                  {signalement.titre}
                </h1>
                {/* Date */}
                <div style={{ fontSize: '0.78rem', color: 'var(--eco-text-secondary)' }}>
                  <i className="bi bi-calendar3 me-1"></i>
                  Signalé le {new Date(signalement.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {/* Badge de statut */}
              <span style={{ background: statutInfo.bg, color: statutInfo.color, padding: '6px 14px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                {statutInfo.label}
              </span>
            </div>

            {/* Description complète */}
            <p style={{ color: 'var(--eco-text-secondary)', lineHeight: 1.8, fontSize: '0.92rem', margin: 0 }}>
              {signalement.description}
            </p>
          </div>

          {/* ---- ANALYSE IA ---- */}
          {signalement.iaAnalyse && (
            <div className="eco-card p-4 mb-4" style={{ border: '1px solid rgba(76,175,128,0.25)', background: 'rgba(45,122,78,0.03)' }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(45,122,78,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-cpu-fill" style={{ color: 'var(--eco-accent)' }}></i>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--eco-text-primary)' }}>Analyse Intelligence Artificielle</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--eco-text-secondary)' }}>Traitement automatique des données de l'incident</div>
                </div>
                {/* Niveau de gravité calculé */}
                <div className="ms-auto d-flex align-items-center gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <div key={n} style={{ width: 12, height: 20, borderRadius: 4, background: n <= signalement.gravite ? (signalement.gravite >= 4 ? '#e74c3c' : signalement.gravite >= 3 ? '#e67e22' : '#27ae60') : 'var(--eco-border)' }} />
                  ))}
                  <span style={{ marginLeft: 6, fontSize: '0.75rem', fontWeight: 700, color: signalement.gravite >= 4 ? '#e74c3c' : signalement.gravite >= 3 ? '#e67e22' : '#27ae60' }}>
                    {signalement.graviteLabel}
                  </span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--eco-text-secondary)', lineHeight: 1.7 }}>
                {signalement.iaAnalyse}
              </p>
            </div>
          )}

          {/* ---- FIL DE COMMENTAIRES ---- */}
          <div className="eco-card p-4">
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--eco-text-primary)', marginBottom: 20 }}>
              <i className="bi bi-chat-dots-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>
              Suivi & Commentaires ({signalement.commentaires?.length || 0})
            </h3>

            {/* Liste des commentaires */}
            <div className="d-flex flex-column gap-3 mb-4">
              {signalement.commentaires?.length === 0 ? (
                <div style={{ color: 'var(--eco-text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                  Aucun commentaire pour l'instant. Soyez le premier à commenter.
                </div>
              ) : (
                signalement.commentaires?.map((c, i) => (
                  <div key={i} className="d-flex gap-3">
                    {/* Avatar de l'auteur */}
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--eco-accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                      {c.auteur?.charAt(0) || 'A'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--eco-text-primary)' }}>{c.auteur}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--eco-text-secondary)' }}>
                          {new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ background: 'var(--eco-bg-primary)', padding: '10px 14px', borderRadius: '0 12px 12px 12px', border: '1px solid var(--eco-border)', fontSize: '0.88rem', color: 'var(--eco-text-primary)', lineHeight: 1.7 }}>
                        {c.texte}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Formulaire d'ajout de commentaire */}
            <form onSubmit={handleAddComment}>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="eco-input"
                  placeholder="Ajouter un commentaire ou une mise à jour..."
                  rows={3}
                  style={{ resize: 'none', paddingBottom: 48 }}
                />
                <button
                  type="submit"
                  disabled={commentLoading || !newComment.trim()}
                  className="btn btn-sm rounded-2"
                  style={{
                    position: 'absolute', bottom: 10, right: 10,
                    background: 'var(--eco-accent-gradient)', color: '#fff',
                    fontSize: '0.82rem', fontWeight: 600, padding: '7px 16px',
                    border: 'none',
                  }}
                >
                  {commentLoading ? <InlineLoader size="sm" /> : <><i className="bi bi-send-fill me-1"></i>Envoyer</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ==================== PANNEAU LATÉRAL DROIT ==================== */}
        <div className="col-lg-4">

          {/* Coordonnées GPS */}
          <div className="eco-card p-4 mb-4">
            <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--eco-text-primary)', marginBottom: 14 }}>
              <i className="bi bi-geo-alt-fill me-2" style={{ color: '#e74c3c' }}></i> Localisation GPS
            </h4>
            <div className="d-flex flex-column gap-2">
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--eco-bg-primary)', borderRadius: 8 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--eco-text-secondary)' }}>Latitude</span>
                <code style={{ fontSize: '0.82rem', color: 'var(--eco-accent)', fontFamily: 'monospace' }}>{signalement.lat}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--eco-bg-primary)', borderRadius: 8 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--eco-text-secondary)' }}>Longitude</span>
                <code style={{ fontSize: '0.82rem', color: 'var(--eco-accent)', fontFamily: 'monospace' }}>{signalement.lng}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--eco-bg-primary)', borderRadius: 8 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--eco-text-secondary)' }}>Commune</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--eco-text-primary)' }}>{signalement.commune}</span>
              </div>
            </div>
            {/* Lien vers Google Maps */}
            <a
              href={`https://maps.google.com/?q=${signalement.lat},${signalement.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm w-100 rounded-2 mt-3"
              style={{ border: '1px solid var(--eco-border)', color: 'var(--eco-text-secondary)', background: 'transparent', fontSize: '0.78rem' }}
            >
              <i className="bi bi-map me-1"></i> Voir sur Google Maps
            </a>
          </div>

          {/* Gestion du statut (Autorités uniquement) */}
          {user?.role === 'autorite' && (
            <div className="eco-card p-4 mb-4" style={{ border: '1px solid rgba(255,193,7,0.3)', background: 'rgba(255,193,7,0.04)' }}>
              <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--eco-text-primary)', marginBottom: 14 }}>
                <i className="bi bi-shield-fill-check me-2" style={{ color: '#f39c12' }}></i> Gestion du Statut
              </h4>
              <div className="d-flex flex-column gap-2">
                {Object.entries(STATUTS).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => handleUpdateStatut(key)}
                    disabled={signalement.statut === key || statutLoading}
                    className="btn btn-sm rounded-2 text-start"
                    style={{
                      background: signalement.statut === key ? val.bg : 'var(--eco-bg-primary)',
                      border: `1.5px solid ${signalement.statut === key ? val.color : 'var(--eco-border)'}`,
                      color: signalement.statut === key ? val.color : 'var(--eco-text-secondary)',
                      fontWeight: signalement.statut === key ? 700 : 400,
                      fontSize: '0.82rem',
                      padding: '9px 14px',
                    }}
                  >
                    {signalement.statut === key && <i className="bi bi-check2 me-2"></i>}
                    {val.label}
                    {statutLoading && signalement.statut !== key && <InlineLoader size="sm" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lien retour */}
          <Link
            to="/signalements"
            className="btn w-100 rounded-3 d-flex align-items-center justify-content-center gap-2"
            style={{ border: '1px solid var(--eco-border)', color: 'var(--eco-text-secondary)', background: 'transparent', padding: '11px' }}
          >
            <i className="bi bi-arrow-left"></i> Retour à la liste
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignalementDetails
