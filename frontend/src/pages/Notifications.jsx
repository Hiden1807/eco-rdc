// =============================================================
// src/pages/Notifications.jsx - Centre de notifications
// Chaque notification peut ouvrir la ressource qui l'a provoquee.
// =============================================================
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notificationApi'
import Loader from '../components/Loader'

function notificationTarget(item) {
  const payload = item.payload || {}
  if (payload.signalement_id) return `/signalements/${payload.signalement_id}`
  if (payload.publication_id) return `/publications?publication=${payload.publication_id}`
  if (payload.report_id) return '/reports'
  return ''
}

function iconForType(type = '') {
  if (type.includes('critical')) return 'bi-exclamation-triangle-fill'
  if (type.includes('risk_zone')) return 'bi-activity'
  if (type.includes('ai_inconsistency')) return 'bi-shield-exclamation'
  if (type.includes('system')) return 'bi-sliders'
  if (type.includes('report')) return 'bi-file-earmark-text-fill'
  if (type.includes('education')) return 'bi-book-fill'
  if (type.includes('signalement')) return 'bi-geo-alt-fill'
  return 'bi-bell-fill'
}

const Notifications = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const data = await getNotifications()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 15000)
    return () => clearInterval(timer)
  }, [])

  const readOne = async (id) => {
    await markNotificationRead(id)
    refresh()
  }

  const readAll = async () => {
    await markAllNotificationsRead()
    refresh()
  }

  if (loading) return <Loader message="Chargement des notifications..." />

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: 24 }}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 style={{ fontWeight: 800, color: 'var(--eco-text-primary)', marginBottom: 4 }}>Notifications</h1>
          <p style={{ color: 'var(--eco-text-secondary)', margin: 0 }}>Alertes, signalements, rapports et publications provenant du backend.</p>
        </div>
        <button className="btn-eco btn rounded-3" onClick={readAll} disabled={!items.some((item) => !item.is_read)}>
          <i className="bi bi-check2-all me-2"></i>Tout marquer lu
        </button>
      </div>

      <div className="d-flex flex-column gap-3">
        {items.map((item) => {
          const target = notificationTarget(item)
          const card = (
            <article className="eco-card p-3 h-100" style={{ borderLeft: `5px solid ${item.is_read ? 'var(--eco-border)' : 'var(--eco-accent)'}`, cursor: target ? 'pointer' : 'default' }}>
              <div className="d-flex justify-content-between gap-3">
                <div className="d-flex gap-3" style={{ minWidth: 0 }}>
                  {item.payload?.photo ? (
                    <img className="eco-signalement-thumb" src={item.payload.photo} alt={item.title} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: item.is_read ? 'var(--eco-border)' : 'rgba(45,122,78,0.12)', color: item.is_read ? 'var(--eco-text-secondary)' : 'var(--eco-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`bi ${iconForType(item.notification_type)}`}></i>
                    </div>
                  )}
                  <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 4 }}>{item.title}</h2>
                    <p style={{ color: 'var(--eco-text-secondary)', marginBottom: 4 }}>{item.message}</p>
                    <small style={{ color: 'var(--eco-text-secondary)' }}>{new Date(item.created_at).toLocaleString('fr-FR')}</small>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-2">
                  {target && <span className="btn btn-sm btn-outline-success"><i className="bi bi-arrow-right"></i></span>}
                  {!item.is_read && <button className="btn btn-sm btn-outline-secondary" onClick={(event) => { event.preventDefault(); event.stopPropagation(); readOne(item.id) }}>Lu</button>}
                </div>
              </div>
            </article>
          )
          return target ? (
            <Link key={item.id} to={target} onClick={() => !item.is_read && markNotificationRead(item.id)} className="text-decoration-none" style={{ color: 'inherit' }}>
              {card}
            </Link>
          ) : (
            <div key={item.id}>{card}</div>
          )
        })}
        {!items.length && <div className="eco-card p-5 text-center">Aucune notification pour le moment.</div>}
      </div>
    </div>
  )
}

export default Notifications
