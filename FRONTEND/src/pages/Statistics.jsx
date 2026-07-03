// =============================================================
// src/pages/Statistics.jsx — Graphiques d'évolution écologique
// Design: Tableaux de bord analytiques avec graphiques SVG natifs
// =============================================================
import React, { useState, useEffect } from 'react'
import { getEvolutionStats } from '../api/dashboardApi'
import Loader from '../components/Loader'

/**
 * BarChart — Graphique à barres SVG natif (aucune dépendance)
 * @param {Array} data - Données à afficher [{label, value, color}]
 * @param {number} height - Hauteur du graphique
 */
const BarChart = ({ data, height = 200, valueKey = 'value', labelKey = 'label', color = 'var(--eco-accent)' }) => {
  const max = Math.max(...data.map((d) => d[valueKey]), 1)
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" height={height + 40} viewBox={`0 0 ${data.length * 70} ${height + 40}`} preserveAspectRatio="xMidYMid meet">
        {/* Boucle sur chaque barre */}
        {data.map((d, i) => {
          const barH = (d[valueKey] / max) * height
          const x = i * 70 + 10
          const y = height - barH
          return (
            <g key={i}>
              {/* Fond de barre (trace) */}
              <rect x={x} y={0} width={50} height={height} rx={6} fill="var(--eco-border)" opacity={0.3} />
              {/* Barre de valeur */}
              <rect x={x} y={y} width={50} height={barH} rx={6} fill={d.color || color} opacity={0.85} style={{ transition: 'height 0.8s ease' }} />
              {/* Valeur en haut de la barre */}
              <text x={x + 25} y={y - 6} textAnchor="middle" fill="var(--eco-text-primary)" fontSize={11} fontWeight={700}>
                {d[valueKey]}
              </text>
              {/* Label sous la barre */}
              <text x={x + 25} y={height + 18} textAnchor="middle" fill="var(--eco-text-secondary)" fontSize={10}>
                {d[labelKey]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/**
 * DonutChart — Graphique donut SVG natif
 * @param {Array} segments - [{label, pct, color}]
 */
const DonutChart = ({ segments }) => {
  const R = 70, cx = 90, cy = 90, stroke = 28
  const circumference = 2 * Math.PI * R
  let cumulative = 0 // Offset cumulatif pour chaque segment

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      {/* SVG du donut */}
      <svg width={180} height={180} viewBox="0 0 180 180" style={{ flexShrink: 0 }}>
        {/* Cercle de fond */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--eco-border)" strokeWidth={stroke} />
        {/* Segments colorés */}
        {segments.map((seg, i) => {
          const length = (seg.pct / 100) * circumference
          const offset = circumference - cumulative
          cumulative += length
          return (
            <circle
              key={i} cx={cx} cy={cy} r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${length} ${circumference}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          )
        })}
        {/* Texte central */}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--eco-text-primary)" fontSize={22} fontWeight={800}>{segments.length}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--eco-text-secondary)" fontSize={10}>Types</text>
      </svg>
      {/* Légende */}
      <div className="d-flex flex-column gap-2">
        {segments.map((seg, i) => (
          <div key={i} className="d-flex align-items-center gap-2">
            <div style={{ width: 12, height: 12, borderRadius: 3, background: seg.color, flexShrink: 0 }}></div>
            <span style={{ fontSize: '0.78rem', color: 'var(--eco-text-primary)', fontWeight: 500 }}>{seg.label}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)', marginLeft: 4 }}>{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const Statistics = () => {
  // État des données statistiques
  const [data, setData] = useState(null)
  // État de chargement
  const [loading, setLoading] = useState(true)
  // Onglet actif du tableau de bord
  const [activeTab, setActiveTab] = useState('signalements')

  useEffect(() => {
    const fetch = async () => {
      try {
        const stats = await getEvolutionStats()
        setData(stats)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  if (loading) return <Loader message="Chargement des statistiques..." />

  // Couleurs pour le graphique par type
  const parTypeColors = ['#3498db', '#e74c3c', '#e67e22', '#8e44ad', '#e74c3c']

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>

      {/* ---- EN-TÊTE ---- */}
      <div className="mb-5 animate-fade-in">
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--eco-text-primary)', margin: 0 }}>
          <i className="bi bi-bar-chart-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>
          Statistiques Écologiques — Kinshasa
        </h1>
        <p style={{ color: 'var(--eco-text-secondary)', marginTop: 4, fontSize: '0.9rem' }}>
          Analyse des données environnementales des 24 communes de Kinshasa
        </p>
      </div>

      {/* ---- ONGLETS ---- */}
      <div className="d-flex gap-2 mb-4 p-1 rounded-3" style={{ background: 'var(--eco-bg-card)', border: '1px solid var(--eco-border)', display: 'inline-flex' }}>
        {[
          { key: 'signalements', label: 'Signalements', icon: 'bi-collection-fill' },
          { key: 'types', label: 'Par Type', icon: 'bi-pie-chart-fill' },
          { key: 'inondations', label: 'Zones Inondables', icon: 'bi-water' },
          { key: 'collecte', label: 'Déchets Collectés', icon: 'bi-recycle' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="btn btn-sm rounded-2 d-flex align-items-center gap-2"
            style={{
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: activeTab === tab.key ? 'var(--eco-accent-gradient)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--eco-text-secondary)',
              border: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <i className={`bi ${tab.icon}`}></i>
            <span className="d-none d-sm-block">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ==================== ONGLET : SIGNALEMENTS ==================== */}
      {activeTab === 'signalements' && (
        <div className="animate-fade-in">
          {/* Métriques résumées */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Total 6 mois', value: data.mensuel.reduce((a, b) => a + b.signalements, 0), icon: 'bi-collection', color: '#3498db' },
              { label: 'Résolus', value: data.mensuel.reduce((a, b) => a + b.resolus, 0), icon: 'bi-check-circle', color: '#27ae60' },
              { label: 'Taux Résolution', value: Math.round((data.mensuel.reduce((a, b) => a + b.resolus, 0) / data.mensuel.reduce((a, b) => a + b.signalements, 0)) * 100) + '%', icon: 'bi-graph-up', color: '#f39c12', isText: true },
              { label: 'Déchets Collectés', value: data.mensuel.reduce((a, b) => a + b.dechets, 0).toFixed(1) + 't', icon: 'bi-recycle', color: '#8e44ad', isText: true },
            ].map((m, i) => (
              <div key={i} className="col-6 col-md-3">
                <div className="stat-card text-center">
                  <i className={`bi ${m.icon} d-block mb-2`} style={{ fontSize: '1.5rem', color: m.color }}></i>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--eco-text-primary)' }}>{m.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)', marginTop: 4 }}>{m.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Graphique d'évolution mensuelle */}
          <div className="eco-card p-4">
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--eco-text-primary)', marginBottom: 20 }}>
              Évolution mensuelle des signalements (6 derniers mois)
            </h3>
            <div className="row g-4">
              <div className="col-md-6">
                <div style={{ fontSize: '0.8rem', color: 'var(--eco-text-secondary)', marginBottom: 8, fontWeight: 600 }}>📊 Signalements reçus</div>
                <BarChart data={data.mensuel} valueKey="signalements" labelKey="mois" color="#3498db" />
              </div>
              <div className="col-md-6">
                <div style={{ fontSize: '0.8rem', color: 'var(--eco-text-secondary)', marginBottom: 8, fontWeight: 600 }}>✅ Problèmes résolus</div>
                <BarChart data={data.mensuel} valueKey="resolus" labelKey="mois" color="#27ae60" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ONGLET : PAR TYPE ==================== */}
      {activeTab === 'types' && (
        <div className="animate-fade-in eco-card p-4">
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--eco-text-primary)', marginBottom: 24 }}>
            Répartition des incidents par type à Kinshasa
          </h3>
          <div className="row align-items-center g-4">
            <div className="col-md-5">
              <DonutChart segments={data.parType.map((t, i) => ({ label: t.type, pct: t.pct, color: parTypeColors[i] }))} />
            </div>
            <div className="col-md-7">
              <div className="d-flex flex-column gap-3">
                {data.parType.map((t, i) => (
                  <div key={i}>
                    <div className="d-flex justify-content-between mb-1">
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--eco-text-primary)' }}>{t.type}</span>
                      <span style={{ fontSize: '0.82rem', color: parTypeColors[i], fontWeight: 700 }}>{t.count} incidents ({t.pct}%)</span>
                    </div>
                    <div className="eco-progress">
                      <div className="eco-progress-bar" style={{ width: `${t.pct}%`, background: parTypeColors[i] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ONGLET : ZONES INONDABLES ==================== */}
      {activeTab === 'inondations' && (
        <div className="animate-fade-in eco-card p-4">
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--eco-text-primary)', marginBottom: 8 }}>
            🌊 Indice de risque d'inondation par commune
          </h3>
          <p style={{ color: 'var(--eco-text-secondary)', fontSize: '0.82rem', marginBottom: 24 }}>
            Score calculé par l'IA sur la base de l'historique des inondations, de la topographie et des données pluviométriques de Kinshasa.
          </p>
          <div className="d-flex flex-column gap-3">
            {data.zonesInondables.map((z, i) => {
              const color = z.risque >= 80 ? '#e74c3c' : z.risque >= 60 ? '#e67e22' : z.risque >= 40 ? '#f39c12' : '#27ae60'
              const label = z.risque >= 80 ? 'CRITIQUE' : z.risque >= 60 ? 'ÉLEVÉ' : z.risque >= 40 ? 'MODÉRÉ' : 'FAIBLE'
              return (
                <div key={i}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--eco-text-primary)' }}>{z.commune}</span>
                      <span style={{ background: `${color}18`, color, padding: '1px 8px', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700, border: `1px solid ${color}30` }}>{label}</span>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color }}>{z.risque}%</span>
                  </div>
                  <div className="eco-progress" style={{ height: 10 }}>
                    <div className="eco-progress-bar" style={{ width: `${z.risque}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ==================== ONGLET : DÉCHETS COLLECTÉS ==================== */}
      {activeTab === 'collecte' && (
        <div className="animate-fade-in eco-card p-4">
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--eco-text-primary)', marginBottom: 20 }}>
            ♻️ Tonnes de déchets collectés (6 derniers mois)
          </h3>
          <BarChart data={data.mensuel} valueKey="dechets" labelKey="mois" color="#27ae60" height={220} />
          <div className="mt-4 p-3 rounded-3" style={{ background: 'rgba(39,174,96,0.07)', border: '1px solid rgba(39,174,96,0.2)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--eco-text-primary)' }}>
              <strong style={{ color: '#27ae60' }}>
                {data.mensuel.reduce((a, b) => a + b.dechets, 0).toFixed(1)} tonnes
              </strong>{' '}
              collectées sur les 6 derniers mois à travers les 24 communes de Kinshasa.
              Soit une moyenne de{' '}
              <strong style={{ color: '#27ae60' }}>
                {(data.mensuel.reduce((a, b) => a + b.dechets, 0) / 6).toFixed(1)} t/mois
              </strong>.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Statistics
