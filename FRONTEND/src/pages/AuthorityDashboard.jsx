// =============================================================
// src/pages/AuthorityDashboard.jsx — Centre de Contrôle de Crise
// Design: Interface "War Room" avec stats temps réel + urgences
// =============================================================
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getStatsAutorite } from '../api/dashboardApi'
import Loader from '../components/Loader'
import { updateStatut } from '../api/signalementApi'

// Priorité des urgences avec couleurs et icônes
const PRIORITE = {
  CRITIQUE: { color: '#922b21', bg: 'rgba(146,43,33,0.15)', icon: 'bi-radioactive' },
  HAUTE:    { color: '#e74c3c', bg: 'rgba(231,76,60,0.12)', icon: 'bi-exclamation-octagon-fill' },
  MOYENNE:  { color: '#e67e22', bg: 'rgba(230,126,34,0.12)', icon: 'bi-exclamation-triangle-fill' },
}

const AuthorityDashboard = () => {
  const { user } = useAuth()
  // État des statistiques de l'autorité
  const [stats, setStats] = useState(null)
  // État de chargement
  const [loading, setLoading] = useState(true)
  // Commune sélectionnée pour le filtre (vide = toutes)
  const [communeFiltre, setCommuneFiltre] = useState('')
  // Indicateur d'action en cours (traitement d'une urgence)
  const [actionId, setActionId] = useState(null)

  // Charge les données au montage
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getStatsAutorite()
        setStats(data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  /**
   * handleTraiter — Marque une urgence comme "en traitement"
   * @param {number} id - ID du signalement
   */
  const handleTraiter = async (id) => {
    setActionId(id) // Active le spinner sur ce bouton
    await updateStatut(id, 'en_traitement')
    // Met à jour localement la liste des urgences
    setStats((prev) => ({
      ...prev,
      urgencesActuelles: prev.urgencesActuelles.filter((u) => u.id !== id),
    }))
    setActionId(null)
  }

  if (loading) return <Loader message="Chargement du centre de contrôle..." />

  // Filtre les performances par commune si une est sélectionnée
  const performanceFiltree = communeFiltre
    ? stats.performanceCommunes.filter((c) => c.commune === communeFiltre)
    : stats.performanceCommunes

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>

      {/* ==================== EN-TÊTE "WAR ROOM" ==================== */}
      <div className="mb-5 animate-fade-in">
        <div
          className="rounded-4 p-4"
          style={{
            background: 'linear-gradient(135deg, #1a0a0a 0%, #3d1010 50%, #6b1f1f 100%)',
            border: '1px solid rgba(231,76,60,0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(231,76,60,0.05)', top: -100, right: -100 }}></div>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-3 mb-2">
                {/* Indicateur "En Direct" */}
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(231,76,60,0.2)', border: '1px solid rgba(231,76,60,0.4)', color: '#e74c3c', padding: '4px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#e74c3c', display: 'inline-block', animation: 'pulse-eco 1s infinite' }}></span>
                  CENTRE DE CONTRÔLE
                </span>
              </div>
              <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.6rem', margin: 0 }}>
                Tableau de Bord — Autorité Urbaine
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: '6px 0 0', fontSize: '0.88rem' }}>
                {user?.name} • {user?.commune} • Kinshasa
              </p>
            </div>
            {/* Horodatage en direct */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Dernière mise à jour</div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MÉTRIQUES GLOBALES ==================== */}
      <div className="row g-3 mb-5">
        {[
          { label: 'Total Incidents', value: stats?.totalSignalements, icon: 'bi-collection-fill', color: '#3498db', suffix: '' },
          { label: 'Traités', value: stats?.traites, icon: 'bi-check-circle-fill', color: '#27ae60', suffix: '' },
          { label: 'Urgences Actives', value: stats?.urgences, icon: 'bi-exclamation-triangle-fill', color: '#e74c3c', suffix: '' },
          { label: 'Taux de Résolution', value: stats?.tauxResolution, icon: 'bi-graph-up-arrow', color: '#f39c12', suffix: '%' },
          { label: 'Délai Moyen', value: stats?.tempsMoyenTraitement, icon: 'bi-clock-fill', color: '#8e44ad', isText: true },
        ].map((m, i) => (
          <div key={i} className={`col-6 col-md-4 col-lg animate-fade-in-up delay-${i * 100}`}>
            <div className="stat-card h-100 text-center">
              <div className="stat-icon mx-auto mb-3" style={{ background: `${m.color}15`, color: m.color }}>
                <i className={`bi ${m.icon}`}></i>
              </div>
              <div style={{ fontSize: m.isText ? '1.4rem' : '2rem', fontWeight: 800, color: 'var(--eco-text-primary)' }}>
                {m.value}{m.suffix}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)', marginTop: 4 }}>{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">

        {/* ==================== URGENCES À TRAITER ==================== */}
        <div className="col-lg-6">
          <div className="eco-card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0, color: 'var(--eco-text-primary)' }}>
                <i className="bi bi-alarm-fill me-2" style={{ color: '#e74c3c' }}></i>
                Urgences à Traiter ({stats?.urgencesActuelles?.length})
              </h3>
            </div>

            {/* Liste des urgences */}
            <div className="d-flex flex-column gap-3">
              {stats?.urgencesActuelles?.map((u) => {
                const prio = PRIORITE[u.priorite] || PRIORITE.MOYENNE
                return (
                  <div
                    key={u.id}
                    className="p-3 rounded-3 d-flex align-items-start gap-3"
                    style={{ background: prio.bg, border: `1px solid ${prio.color}30` }}
                  >
                    <i className={`bi ${prio.icon}`} style={{ color: prio.color, fontSize: '1.3rem', flexShrink: 0, marginTop: 2 }}></i>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--eco-text-primary)', marginBottom: 2 }}>{u.titre}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)' }}>📍 {u.commune}</div>
                      <span style={{ background: prio.color, color: '#fff', fontSize: '0.65rem', padding: '2px 8px', borderRadius: 99, fontWeight: 700, marginTop: 4, display: 'inline-block' }}>
                        {u.priorite}
                      </span>
                    </div>
                    {/* Bouton de prise en charge */}
                    <button
                      onClick={() => handleTraiter(u.id)}
                      disabled={actionId === u.id}
                      className="btn btn-sm rounded-2"
                      style={{ background: prio.color, color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '5px 12px', flexShrink: 0 }}
                    >
                      {actionId === u.id ? <i className="bi bi-arrow-repeat" style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}></i> : 'Traiter'}
                    </button>
                  </div>
                )
              })}
              {stats?.urgencesActuelles?.length === 0 && (
                <div className="text-center py-4" style={{ color: 'var(--eco-text-secondary)' }}>
                  <i className="bi bi-check-circle-fill d-block mb-2" style={{ fontSize: '2rem', color: '#27ae60' }}></i>
                  Aucune urgence active — Bonne situation !
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================== PERFORMANCE PAR COMMUNE ==================== */}
        <div className="col-lg-6">
          <div className="eco-card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0, color: 'var(--eco-text-primary)' }}>
                <i className="bi bi-buildings-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>
                Performance par Commune
              </h3>
              {/* Filtre par commune */}
              <select
                value={communeFiltre}
                onChange={(e) => setCommuneFiltre(e.target.value)}
                className="form-select form-select-sm rounded-2"
                style={{ width: 140, fontSize: '0.78rem', background: 'var(--eco-bg-primary)', border: '1px solid var(--eco-border)', color: 'var(--eco-text-primary)' }}
              >
                <option value="">Toutes</option>
                {stats?.performanceCommunes?.map((c) => (
                  <option key={c.commune} value={c.commune}>{c.commune}</option>
                ))}
              </select>
            </div>

            {/* Tableau de performance */}
            <div className="d-flex flex-column gap-2">
              {performanceFiltree.map((c, i) => {
                // Couleur de la barre selon le taux de résolution
                const color = c.taux >= 75 ? '#27ae60' : c.taux >= 50 ? '#f39c12' : '#e74c3c'
                return (
                  <div key={i}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--eco-text-primary)' }}>{c.commune}</span>
                      <span style={{ fontSize: '0.75rem', color }}>
                        {c.resolus}/{c.signalements} résolus — <strong>{c.taux}%</strong>
                      </span>
                    </div>
                    <div className="eco-progress" style={{ height: 8 }}>
                      <div className="eco-progress-bar" style={{ width: `${c.taux}%`, background: `linear-gradient(90deg, ${color}aa, ${color})` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Lien vers tous les signalements */}
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--eco-border)' }}>
              <Link to="/signalements" className="btn-eco btn w-100 rounded-3" style={{ fontSize: '0.88rem' }}>
                <i className="bi bi-list-ul me-2"></i> Gérer tous les incidents
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthorityDashboard
