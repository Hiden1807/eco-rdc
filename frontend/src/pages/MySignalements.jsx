// =============================================================
// src/pages/MySignalements.jsx — Historique filtrable des signalements
// Design: Tableau interactif avec filtres multi-critères
// =============================================================
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSignalements, getTypesIncident } from '../api/signalementApi'
import Loader from '../components/Loader'

const STATUTS = [
  { value: 'nouveau', label: 'Nouveau', color: '#3498db' },
  { value: 'valide', label: 'Validé', color: '#16a085' },
  { value: 'en_traitement', label: 'En Traitement', color: '#e67e22' },
  { value: 'resolu', label: 'Résolu', color: '#27ae60' },
  { value: 'rejete', label: 'Rejeté', color: '#e74c3c' },
]

const MySignalements = () => {
  const { user } = useAuth()
  // État de la liste complète des signalements
  const [signalements, setSignalements] = useState([])
  // État de chargement
  const [loading, setLoading] = useState(true)
  // Types d'incidents chargés depuis la table des catégories du backend.
  const [typesIncident, setTypesIncident] = useState([])
  // État des filtres actifs
  const [filtres, setFiltres] = useState({ statut: '', type: '', search: '' })

  // Charge les signalements de l'utilisateur au montage
  useEffect(() => {
    const fetch = async () => {
      try {
        // Filtre par userId pour récupérer uniquement les signalements du citoyen connecté
        const [signalementsData, categoriesData] = await Promise.all([
          getSignalements({ userId: user?.role === 'citoyen' ? user.id : undefined }),
          getTypesIncident(),
        ])
        setSignalements(signalementsData)
        setTypesIncident(categoriesData)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetch()
  }, [user])

  /**
   * filteredData — Filtre les signalements déjà retournés par le backend.
   * Les libellés et types proviennent de la base via l'API catégories.
   */
  const filteredData = signalements.filter((s) => {
    // Filtre par statut
    if (filtres.statut && s.statut !== filtres.statut) return false
    // Filtre par type d'incident
    if (filtres.type && s.type !== filtres.type) return false
    // Filtre par recherche textuelle (titre ou commune)
    if (filtres.search && !s.titre.toLowerCase().includes(filtres.search.toLowerCase())
      && !s.commune.toLowerCase().includes(filtres.search.toLowerCase())) return false
    return true
  })

  if (loading) return <Loader message="Chargement de vos signalements..." />

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ---- EN-TÊTE ---- */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--eco-text-primary)', margin: 0 }}>
            <i className="bi bi-collection-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>
            {user?.role === 'autorite' ? 'Tous les Incidents' : 'Mes Signalements'}
          </h1>
          <p style={{ color: 'var(--eco-text-secondary)', margin: '4px 0 0', fontSize: '0.85rem' }}>
            {filteredData.length} incident{filteredData.length > 1 ? 's' : ''} affiché{filteredData.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/signalements/new" className="btn-eco btn rounded-3 d-flex align-items-center gap-2">
          <i className="bi bi-plus-circle-fill"></i> Nouveau Signalement
        </Link>
      </div>

      {/* ==================== BARRE DE FILTRES ==================== */}
      <div className="eco-card p-3 mb-4 d-flex align-items-center flex-wrap gap-3">
        {/* Recherche textuelle */}
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--eco-text-secondary)', fontSize: '0.85rem' }}></i>
          <input
            type="text"
            className="eco-input"
            placeholder="Rechercher par titre ou commune..."
            value={filtres.search}
            onChange={(e) => setFiltres((p) => ({ ...p, search: e.target.value }))}
            style={{ paddingLeft: 36, height: 40, fontSize: '0.85rem' }}
          />
        </div>
        {/* Filtre par statut */}
        <select
          className="eco-input"
          value={filtres.statut}
          onChange={(e) => setFiltres((p) => ({ ...p, statut: e.target.value }))}
          style={{ flex: '0 1 160px', height: 40, fontSize: '0.85rem' }}
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {/* Filtre par type */}
        <select
          className="eco-input"
          value={filtres.type}
          onChange={(e) => setFiltres((p) => ({ ...p, type: e.target.value }))}
          style={{ flex: '0 1 180px', height: 40, fontSize: '0.85rem' }}
        >
          <option value="">Tous les types</option>
          {typesIncident.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {/* Bouton de réinitialisation des filtres */}
        {(filtres.statut || filtres.type || filtres.search) && (
          <button
            onClick={() => setFiltres({ statut: '', type: '', search: '' })}
            className="btn btn-sm rounded-2"
            style={{ border: '1px solid var(--eco-border)', color: 'var(--eco-text-secondary)', background: 'transparent', height: 40, padding: '0 16px', fontSize: '0.82rem' }}
          >
            <i className="bi bi-x-circle me-1"></i>Réinitialiser
          </button>
        )}
      </div>

      {/* ==================== TABLEAU DES SIGNALEMENTS ==================== */}
      {filteredData.length === 0 ? (
        // Message vide si aucun résultat
        <div className="eco-card p-5 text-center">
          <i className="bi bi-inbox d-block mb-3" style={{ fontSize: '3rem', color: 'var(--eco-text-secondary)', opacity: 0.4 }}></i>
          <h4 style={{ color: 'var(--eco-text-primary)', fontWeight: 700 }}>Aucun signalement trouvé</h4>
          <p style={{ color: 'var(--eco-text-secondary)', marginBottom: 20 }}>
            {filtres.search || filtres.statut || filtres.type
              ? 'Modifiez vos filtres de recherche.'
              : 'Vous n\'avez pas encore soumis de signalement.'}
          </p>
          <Link to="/signalements/new" className="btn-eco btn rounded-3">
            <i className="bi bi-plus-circle-fill me-2"></i>Créer mon premier signalement
          </Link>
        </div>
      ) : (
        <>
        <div className="d-md-none d-flex flex-column gap-3">
          {filteredData.map((s) => {
            const typeInfo = typesIncident.find((t) => t.value === s.type) || {
              label: s.typeLabel || s.type || 'Type non classé',
              icon: 'bi-tags',
              color: 'var(--eco-text-secondary)',
            }
            const statutInfo = STATUTS.find((st) => st.value === s.statut) || {}
            return (
              <article className="eco-card p-3" key={s.id}>
                <div className="d-flex gap-3">
                  {s.photoUrl ? (
                    <img className="eco-signalement-thumb" src={s.photoUrl} alt={s.titre} />
                  ) : (
                    <div className="eco-signalement-thumb eco-signalement-thumb-empty">
                      <i className="bi bi-image"></i>
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                      <span style={{ background: `${statutInfo.color}18`, color: statutInfo.color, padding: '4px 9px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 800 }}>
                        {statutInfo.label || s.statut}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--eco-text-secondary)' }}>{new Date(s.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <h2 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--eco-text-primary)' }}>{s.titre}</h2>
                    <div style={{ color: typeInfo.color, fontSize: '0.78rem', fontWeight: 700, marginBottom: 6 }}>
                      <i className={`bi ${typeInfo.icon} me-1`}></i>{typeInfo.label}
                    </div>
                    <div style={{ color: 'var(--eco-text-secondary)', fontSize: '0.78rem' }}>
                      <i className="bi bi-geo-alt me-1" style={{ color: 'var(--eco-accent)' }}></i>{s.commune || 'Commune non precisee'}
                    </div>
                  </div>
                </div>
                <Link to={`/signalements/${s.id}`} className="btn btn-sm rounded-2 w-100 mt-3" style={{ background: 'var(--eco-bg-primary)', border: '1px solid var(--eco-border)', color: 'var(--eco-text-primary)' }}>
                  Voir le dossier <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </article>
            )
          })}
        </div>

        <div className="eco-card p-0 d-none d-md-block" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="eco-table">
              <thead>
                <tr>
                  <th>Incident</th>
                  <th>Type</th>
                  <th>Commune</th>
                  <th>Gravité</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {/* Boucle sur les signalements filtrés */}
                {filteredData.map((s) => {
                  const typeInfo = typesIncident.find((t) => t.value === s.type) || {
                    label: s.typeLabel || s.type || 'Type non classé',
                    icon: 'bi-tags',
                    color: 'var(--eco-text-secondary)',
                  }
                  const statutInfo = STATUTS.find((st) => st.value === s.statut) || {}

                  return (
                    <tr key={s.id}>
                      {/* Titre et description courte */}
                      <td>
                        <div className="d-flex align-items-center gap-2" style={{ minWidth: 230 }}>
                          {s.photoUrl ? (
                            <img className="eco-signalement-thumb" src={s.photoUrl} alt={s.titre} />
                          ) : (
                            <div className="eco-signalement-thumb eco-signalement-thumb-empty">
                              <i className="bi bi-image"></i>
                            </div>
                          )}
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--eco-text-primary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.titre}
                          </div>
                        </div>
                      </td>
                      {/* Badge du type */}
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, color: typeInfo.color }}>
                          <i className={`bi ${typeInfo.icon}`}></i>
                          {typeInfo.label}
                        </span>
                      </td>
                      {/* Commune */}
                      <td style={{ fontSize: '0.82rem', color: 'var(--eco-text-secondary)' }}>
                        <i className="bi bi-geo-alt me-1" style={{ color: 'var(--eco-accent)' }}></i>{s.commune}
                      </td>
                      {/* Indicateur de gravité (barres) */}
                      <td>
                        <div className="d-flex gap-1">
                          {[1,2,3,4,5].map((n) => (
                            <div key={n} style={{ width: 8, height: 16, borderRadius: 3, background: n <= s.gravite ? (s.gravite >= 4 ? '#e74c3c' : s.gravite >= 3 ? '#e67e22' : '#27ae60') : 'var(--eco-border)' }} />
                          ))}
                        </div>
                      </td>
                      {/* Badge du statut */}
                      <td>
                        <span style={{ background: `${statutInfo.color}18`, color: statutInfo.color, padding: '4px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {statutInfo.label}
                        </span>
                      </td>
                      {/* Date */}
                      <td style={{ fontSize: '0.78rem', color: 'var(--eco-text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(s.date).toLocaleDateString('fr-FR')}
                      </td>
                      {/* Action: voir détails */}
                      <td>
                        <Link
                          to={`/signalements/${s.id}`}
                          className="btn btn-sm rounded-2"
                          style={{ fontSize: '0.75rem', padding: '5px 12px', background: 'var(--eco-bg-primary)', border: '1px solid var(--eco-border)', color: 'var(--eco-text-primary)' }}
                        >
                          Voir <i className="bi bi-arrow-right ms-1"></i>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  )
}

export default MySignalements
