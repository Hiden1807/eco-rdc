// =============================================================
// src/pages/Reports.jsx - Rapports institutionnels
// Generation et lecture des rapports produits par le backend.
// =============================================================
import React, { useEffect, useState } from 'react'
import { generateReport, getReports } from '../api/reportApi'
import Loader from '../components/Loader'

const reportTypes = [
  { value: 'national', label: 'Rapport national' },
  { value: 'commune', label: 'Rapport par commune' },
  { value: 'weekly', label: 'Rapport hebdomadaire' },
  { value: 'monthly', label: 'Rapport mensuel' },
  { value: 'urgence', label: 'Rapport urgence' },
  { value: 'performance', label: 'Rapport performance' },
]

const Reports = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [reportType, setReportType] = useState('national')
  const [error, setError] = useState('')

  const refresh = async () => {
    const data = await getReports()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  const create = async () => {
    setGenerating(true)
    setError('')
    try {
      const label = reportTypes.find((item) => item.value === reportType)?.label || 'Rapport ECO RDC'
      await generateReport({ report_type: reportType, title: `${label} - ECO RDC` })
      await refresh()
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Generation impossible.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <Loader message="Chargement des rapports..." />

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', padding: 24 }}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h1 style={{ fontWeight: 800 }}>Rapports institutionnels</h1>
          <p style={{ color: 'var(--eco-text-secondary)' }}>Rapports generes depuis les signalements, statistiques et recommandations stockes en base.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <select className="eco-input" value={reportType} onChange={(event) => setReportType(event.target.value)} style={{ width: 220 }}>
            {reportTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
          <button className="btn-eco btn" disabled={generating} onClick={create}>
            <i className="bi bi-file-earmark-plus-fill me-2"></i>{generating ? 'Generation...' : 'Generer'}
          </button>
        </div>
      </div>

      {error && <div className="eco-card p-3 mb-4" style={{ color: '#e74c3c', borderLeft: '4px solid #e74c3c' }}>{error}</div>}

      <div className="row g-3">
        {items.map((item) => (
          <div className="col-md-6" key={item.id}>
            <article className="eco-card p-4 h-100">
              <small style={{ color: 'var(--eco-accent)', fontWeight: 800, textTransform: 'uppercase' }}>{item.report_type}</small>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 8 }}>{item.title}</h2>
              <p style={{ color: 'var(--eco-text-secondary)' }}>{item.summary}</p>

              <div className="row g-2 my-3">
                {Object.entries(item.statistics || {}).map(([key, value]) => (
                  <div className="col-6" key={key}>
                    <div style={{ background: 'var(--eco-bg-primary)', border: '1px solid var(--eco-border)', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--eco-text-secondary)', textTransform: 'uppercase' }}>{key}</div>
                      <div style={{ fontWeight: 800 }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {(item.recommendations || []).length > 0 && (
                <ul style={{ color: 'var(--eco-text-secondary)', fontSize: '0.86rem', paddingLeft: 18 }}>
                  {item.recommendations.slice(0, 3).map((recommendation, index) => <li key={index}>{recommendation}</li>)}
                </ul>
              )}

              <div className="d-flex gap-2 flex-wrap mt-3">
                {item.pdf && <a href={item.pdf} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success"><i className="bi bi-file-earmark-pdf-fill me-1"></i>PDF</a>}
                <span className="btn btn-sm btn-outline-secondary disabled"><i className="bi bi-clock-history me-1"></i>{new Date(item.generated_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </article>
          </div>
        ))}
        {!items.length && <div className="eco-card p-5 text-center">Aucun rapport genere.</div>}
      </div>
    </div>
  )
}

export default Reports
