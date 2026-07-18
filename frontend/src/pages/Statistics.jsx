// =============================================================
// src/pages/Statistics.jsx - Statistiques publiques
// Utilise l'endpoint public dashboard/public/ sans permissions ministerielles.
// =============================================================
import React, { useEffect, useState } from 'react'
import { predictRisk } from '../api/aiApi'
import { getEvolutionStats } from '../api/dashboardApi'
import Loader from '../components/Loader'

const COLORS = ['#3498db', '#27ae60', '#e67e22', '#8e44ad', '#e74c3c', '#0f766e']

const emptyStats = {
  mensuel: [],
  parType: [],
  zonesInondables: [],
  resume: { total: 0, resolved: 0, active: 0, critical: 0, communes: 0 },
}

const BarChart = ({ data, valueKey, labelKey, color = '#27ae60', height = 220 }) => {
  const rows = data.length ? data : [{ [labelKey]: 'Aucune', [valueKey]: 0 }]
  const max = Math.max(...rows.map((item) => Number(item[valueKey]) || 0), 1)
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" height={height + 42} viewBox={`0 0 ${rows.length * 72} ${height + 42}`} preserveAspectRatio="xMidYMid meet">
        {rows.map((item, index) => {
          const value = Number(item[valueKey]) || 0
          const barHeight = (value / max) * height
          const x = index * 72 + 12
          const y = height - barHeight
          return (
            <g key={`${item[labelKey]}-${index}`}>
              <rect x={x} y={0} width={48} height={height} rx={6} fill="var(--eco-border)" opacity={0.28} />
              <rect x={x} y={y} width={48} height={barHeight} rx={6} fill={color} opacity={0.9} />
              <text x={x + 24} y={Math.max(12, y - 7)} textAnchor="middle" fill="var(--eco-text-primary)" fontSize={11} fontWeight={700}>{value}</text>
              <text x={x + 24} y={height + 20} textAnchor="middle" fill="var(--eco-text-secondary)" fontSize={10}>{item[labelKey]}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const Statistics = () => {
  const [data, setData] = useState(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('signalements')
  const [riskPrediction, setRiskPrediction] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsPayload, riskPayload] = await Promise.all([getEvolutionStats(), predictRisk({ days: 7 })])
        setData(statsPayload)
        setRiskPrediction(riskPayload)
      } catch (err) {
        console.error(err)
        setError("Les statistiques publiques ne sont pas disponibles pour le moment.")
        setData(emptyStats)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <Loader message="Chargement des statistiques..." />

  const totalSignalements = data.mensuel.reduce((sum, row) => sum + (row.signalements || 0), 0)
  const totalResolved = data.mensuel.reduce((sum, row) => sum + (row.resolus || 0), 0)
  const totalWaste = data.mensuel.reduce((sum, row) => sum + (row.dechets || 0), 0)
  const resolutionRate = totalSignalements ? Math.round((totalResolved / totalSignalements) * 100) : 0

  const cards = [
    { label: 'Signalements publics', value: data.resume.total, icon: 'bi-collection-fill', color: '#3498db' },
    { label: 'Cas actifs', value: data.resume.active, icon: 'bi-activity', color: '#e67e22' },
    { label: 'Cas critiques', value: data.resume.critical, icon: 'bi-exclamation-triangle-fill', color: '#e74c3c' },
    { label: 'Communes referencees', value: data.resume.communes, icon: 'bi-buildings-fill', color: '#27ae60' },
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <header className="mb-5 animate-fade-in">
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--eco-text-primary)', margin: 0 }}>
          <i className="bi bi-bar-chart-fill me-2" style={{ color: 'var(--eco-accent)' }}></i>
          Statistiques environnementales
        </h1>
        <p style={{ color: 'var(--eco-text-secondary)', marginTop: 4, fontSize: '0.9rem' }}>
          Donnees publiques agregees depuis les signalements stockes dans la base.
        </p>
      </header>

      {error && (
        <div className="eco-card p-3 mb-4" style={{ color: '#e74c3c', borderLeft: '4px solid #e74c3c' }}>
          <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
        </div>
      )}

      <section className="row g-3 mb-4">
        {cards.map((card) => (
          <div key={card.label} className="col-6 col-md-3">
            <div className="stat-card text-center h-100">
              <i className={`bi ${card.icon} d-block mb-2`} style={{ fontSize: '1.45rem', color: card.color }}></i>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--eco-text-primary)' }}>{card.value || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)', marginTop: 4 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </section>

      <div className="d-flex gap-2 mb-4 p-1 rounded-3 flex-wrap" style={{ background: 'var(--eco-bg-card)', border: '1px solid var(--eco-border)', display: 'inline-flex' }}>
        {[
          { key: 'signalements', label: 'Evolution', icon: 'bi-graph-up-arrow' },
          { key: 'types', label: 'Par type', icon: 'bi-pie-chart-fill' },
          { key: 'risques', label: 'Zones a risque', icon: 'bi-geo-alt-fill' },
          { key: 'collecte', label: 'Estimation collecte', icon: 'bi-recycle' },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="btn btn-sm rounded-2 d-flex align-items-center gap-2" style={{ padding: '8px 14px', fontSize: '0.82rem', fontWeight: 600, background: activeTab === tab.key ? 'var(--eco-accent-gradient)' : 'transparent', color: activeTab === tab.key ? '#fff' : 'var(--eco-text-secondary)', border: 'none' }}>
            <i className={`bi ${tab.icon}`}></i>{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'signalements' && (
        <section className="eco-card p-4">
          <div className="row g-4 align-items-start">
            <div className="col-md-8">
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--eco-text-primary)', marginBottom: 20 }}>Evolution des signalements</h2>
              <BarChart data={data.mensuel} valueKey="signalements" labelKey="mois" color="#3498db" />
            </div>
            <div className="col-md-4">
              <div className="stat-card text-center">
                <i className="bi bi-check-circle-fill mb-2 d-block" style={{ color: '#27ae60', fontSize: '1.5rem' }}></i>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{resolutionRate}%</div>
                <div style={{ color: 'var(--eco-text-secondary)', fontSize: '0.82rem' }}>Taux de resolution public</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'types' && (
        <section className="eco-card p-4">
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--eco-text-primary)', marginBottom: 20 }}>Repartition par type</h2>
          <div className="d-flex flex-column gap-3">
            {(data.parType.length ? data.parType : [{ type: 'Aucune donnee', count: 0, pct: 0 }]).map((item, index) => (
              <div key={`${item.type}-${index}`}>
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{item.type || 'Non classe'}</span>
                  <span style={{ fontSize: '0.82rem', color: COLORS[index % COLORS.length], fontWeight: 700 }}>{item.count} ({item.pct}%)</span>
                </div>
                <div className="eco-progress">
                  <div className="eco-progress-bar" style={{ width: `${item.pct}%`, background: COLORS[index % COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'risques' && (
        <section className="eco-card p-4">
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--eco-text-primary)', marginBottom: 20 }}>Communes prioritaires</h2>
          {riskPrediction && (
            <div className="mb-4 p-3 rounded-3" style={{ background: 'rgba(45,122,78,0.07)', border: '1px solid rgba(45,122,78,0.2)' }}>
              <div className="d-flex justify-content-between flex-wrap gap-2">
                <strong style={{ color: 'var(--eco-accent)' }}>Score IA global: {riskPrediction.score_risque}%</strong>
                <span style={{ color: 'var(--eco-text-secondary)' }}>Tendance: {riskPrediction.tendance}</span>
              </div>
              <div style={{ color: 'var(--eco-text-secondary)', fontSize: '0.86rem', marginTop: 6 }}>{riskPrediction.recommandation}</div>
            </div>
          )}
          <div className="d-flex flex-column gap-3">
            {((riskPrediction?.communes_prioritaires || []).length ? riskPrediction.communes_prioritaires.map((item) => ({ commune: item.commune, risque: item.score_risque, tendance: item.tendance, niveau: item.niveau_risque })) : (data.zonesInondables.length ? data.zonesInondables : [{ commune: 'Aucune zone prioritaire', risque: 0 }])).map((zone) => {
              const color = zone.risque >= 70 ? '#e74c3c' : zone.risque >= 45 ? '#e67e22' : '#27ae60'
              return (
                <div key={zone.commune}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{zone.commune}</span>
                    <span style={{ fontWeight: 800, color }}>{zone.risque}% {zone.tendance ? `- ${zone.tendance}` : ''}</span>
                  </div>
                  <div className="eco-progress" style={{ height: 10 }}>
                    <div className="eco-progress-bar" style={{ width: `${zone.risque}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {activeTab === 'collecte' && (
        <section className="eco-card p-4">
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--eco-text-primary)', marginBottom: 20 }}>Estimation de collecte associee</h2>
          <BarChart data={data.mensuel} valueKey="dechets" labelKey="mois" color="#27ae60" />
          <div className="mt-4 p-3 rounded-3" style={{ background: 'rgba(39,174,96,0.07)', border: '1px solid rgba(39,174,96,0.2)' }}>
            <strong style={{ color: '#27ae60' }}>{totalWaste.toFixed(1)} tonnes estimees</strong>
            <span style={{ color: 'var(--eco-text-secondary)' }}> a partir du volume de signalements publics.</span>
          </div>
        </section>
      )}
    </div>
  )
}

export default Statistics
