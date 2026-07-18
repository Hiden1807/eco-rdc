// =============================================================
// src/pages/MapPage.jsx - Carte SIG connectee au backend Django
// Les incidents, communes et categories viennent exclusivement des API.
// =============================================================
import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMapIncidents } from '../api/mapApi'
import { getCommunes, getTypesIncident } from '../api/signalementApi'
import { InlineLoader } from '../components/Loader'

const GRAVITE_COLORS = {
  1: '#27ae60',
  2: '#f39c12',
  3: '#e67e22',
  4: '#e74c3c',
  5: '#922b21',
}

const MAP_LAYERS = {
  light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
}

function iconForIncident(type = '') {
  if (type.includes('inond')) return 'bi-water'
  if (type.includes('erosion')) return 'bi-exclamation-triangle-fill'
  if (type.includes('pollution')) return 'bi-droplet-half'
  if (type.includes('caniveau')) return 'bi-cone-striped'
  if (type.includes('air') || type.includes('brul')) return 'bi-fire'
  return 'bi-trash3-fill'
}

const MapPage = () => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersGroupRef = useRef(null)
  const tileLayerRef = useRef(null)

  const [incidents, setIncidents] = useState([])
  const [communes, setCommunes] = useState([])
  const [typesIncident, setTypesIncident] = useState([])
  const [loading, setLoading] = useState(true)
  const [communeFiltre, setCommuneFiltre] = useState('')
  const [typeFiltre, setTypeFiltre] = useState('')
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [mapTheme, setMapTheme] = useState('light')

  useEffect(() => {
    if (!window.L || mapInstanceRef.current) return

    const map = window.L.map(mapRef.current, {
      center: [-4.3225, 15.3222],
      zoom: 12,
      zoomControl: false,
    })

    window.L.control.zoom({ position: 'bottomright' }).addTo(map)
    tileLayerRef.current = window.L.tileLayer(MAP_LAYERS.light, {
      attribution: 'OpenStreetMap | CartoDB',
      maxZoom: 19,
    }).addTo(map)

    markersGroupRef.current = window.L.layerGroup().addTo(map)
    mapInstanceRef.current = map

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [communesData, categoriesData] = await Promise.all([
          getCommunes(),
          getTypesIncident(),
        ])
        setCommunes(communesData)
        setTypesIncident(categoriesData)
      } catch (error) {
        console.error('Impossible de charger les filtres SIG :', error)
      }
    }
    loadReferenceData()
  }, [])

  useEffect(() => {
    if (tileLayerRef.current) tileLayerRef.current.setUrl(MAP_LAYERS[mapTheme])
  }, [mapTheme])

  useEffect(() => {
    const fetchAndRender = async () => {
      setLoading(true)
      try {
        const data = await getMapIncidents({ commune: communeFiltre, category: typeFiltre })
        setIncidents(data)
        renderMarkers(data)
      } catch (error) {
        console.error('Impossible de charger la carte SIG :', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAndRender()
  }, [communeFiltre, typeFiltre])

  const renderMarkers = (data) => {
    if (!markersGroupRef.current || !window.L) return
    markersGroupRef.current.clearLayers()

    data.forEach((incident) => {
      if (!incident.lat || !incident.lng) return
      const color = GRAVITE_COLORS[incident.gravite] || '#6b7280'
      const markerIcon = iconForIncident(incident.type)
      const icon = window.L.divIcon({
        html: `
          <div style="
            width: 40px; height: 40px; border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg); background: ${color};
            border: 3px solid #fff; box-shadow: 0 4px 16px rgba(0,0,0,0.35);
            display: flex; align-items: center; justify-content: center;
          ">
            <i class="bi ${markerIcon}" style="transform: rotate(45deg); color: #fff; font-size: 1rem;"></i>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        className: '',
      })

      window.L.marker([incident.lat, incident.lng], { icon })
        .addTo(markersGroupRef.current)
        .on('click', () => {
          setSelectedIncident(incident)
          mapInstanceRef.current?.setView([incident.lat, incident.lng], 15, { animate: true, duration: 1 })
        })
      if (incident.gravite >= 3) {
        window.L.circle([incident.lat, incident.lng], {
          radius: incident.gravite >= 4 ? 420 : 260,
          color,
          weight: 1,
          fillColor: color,
          fillOpacity: incident.gravite >= 4 ? 0.16 : 0.09,
        }).addTo(markersGroupRef.current)
      }
    })
  }

  const flyToCommune = (communeId) => {
    const commune = communes.find((item) => String(item.id) === String(communeId))
    if (commune?.lat && commune?.lng) {
      mapInstanceRef.current?.flyTo([commune.lat, commune.lng], 14, { duration: 1.2 })
    }
  }

  return (
    <div style={{ height: 'calc(100vh - 62px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        className="glass-panel"
        style={{
          borderBottom: '1px solid var(--eco-border)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          zIndex: 10,
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <div style={{ width: 36, height: 36, background: 'var(--eco-accent-gradient)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-geo-alt-fill text-white"></i>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--eco-text-primary)' }}>Carte SIG nationale</span>
        </div>

        <select
          value={communeFiltre}
          onChange={(event) => { setCommuneFiltre(event.target.value); flyToCommune(event.target.value) }}
          className="eco-input"
          style={{ height: 42, width: 220, maxWidth: '100%' }}
        >
          <option value="">Toutes les communes</option>
          {communes.map((commune) => <option key={commune.id} value={commune.id}>{commune.name}</option>)}
        </select>

        <select
          value={typeFiltre}
          onChange={(event) => setTypeFiltre(event.target.value)}
          className="eco-input"
          style={{ height: 42, width: 220, maxWidth: '100%' }}
        >
          <option value="">Tous les types</option>
          {typesIncident.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
        </select>

        <div className="ms-auto d-flex align-items-center gap-2 flex-wrap">
          <button onClick={() => setMapTheme('light')} className="btn btn-sm" style={{ background: mapTheme === 'light' ? 'var(--eco-accent)' : 'transparent', color: mapTheme === 'light' ? '#fff' : 'var(--eco-text-secondary)', border: '1px solid var(--eco-border)', borderRadius: 8 }}>
            <i className="bi bi-sun-fill me-1"></i>Clair
          </button>
          <button onClick={() => setMapTheme('dark')} className="btn btn-sm" style={{ background: mapTheme === 'dark' ? 'var(--eco-accent)' : 'transparent', color: mapTheme === 'dark' ? '#fff' : 'var(--eco-text-secondary)', border: '1px solid var(--eco-border)', borderRadius: 8 }}>
            <i className="bi bi-moon-fill me-1"></i>Sombre
          </button>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} id="eco-map" style={{ width: '100%', height: '100%' }} />

        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 900 }} className="animate-fade-in-up">
          <div className="glass-card p-3 d-flex align-items-center gap-3" style={{ borderRadius: 8 }}>
            <div style={{ width: 44, height: 44, background: 'rgba(39,174,96,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading ? <InlineLoader size="sm" /> : <span style={{ fontWeight: 800, color: '#27ae60', fontSize: '1.1rem' }}>{incidents.length}</span>}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--eco-text-primary)' }}>Incidents affiches</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--eco-text-secondary)' }}>Donnees backend en temps reel</div>
            </div>
          </div>
        </div>

        {selectedIncident && (
          <aside
            className="animate-fade-in glass-card"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 340,
              maxWidth: 'calc(100% - 32px)',
              borderRadius: 8,
              boxShadow: '0 12px 48px rgba(0,0,0,0.24)',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            <div style={{ background: 'var(--eco-accent-gradient)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className={`bi ${iconForIncident(selectedIncident.type)}`}></i>{selectedIncident.titre}
              </span>
              <button type="button" onClick={() => setSelectedIncident(null)} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 6 }}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div style={{ padding: 18 }}>
              <div className="d-flex flex-column gap-3" style={{ fontSize: '0.84rem' }}>
                <div className="d-flex justify-content-between gap-3" style={{ borderBottom: '1px solid var(--eco-border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--eco-text-secondary)' }}><i className="bi bi-geo-alt me-2"></i>Commune</span>
                  <span style={{ fontWeight: 700, color: 'var(--eco-text-primary)' }}>{selectedIncident.commune || 'Non precisee'}</span>
                </div>
                {selectedIncident.adresseExacte && (
                  <div className="d-flex justify-content-between gap-3" style={{ borderBottom: '1px solid var(--eco-border)', paddingBottom: 8 }}>
                    <span style={{ color: 'var(--eco-text-secondary)' }}><i className="bi bi-signpost-fill me-2"></i>Adresse</span>
                    <span style={{ fontWeight: 700, color: 'var(--eco-text-primary)', textAlign: 'right' }}>{selectedIncident.adresseExacte}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between gap-3" style={{ borderBottom: '1px solid var(--eco-border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--eco-text-secondary)' }}><i className="bi bi-exclamation-triangle me-2"></i>Gravite</span>
                  <span style={{ fontWeight: 800, color: GRAVITE_COLORS[selectedIncident.gravite] }}>Niveau {selectedIncident.gravite}</span>
                </div>
                <div className="d-flex justify-content-between gap-3" style={{ borderBottom: '1px solid var(--eco-border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--eco-text-secondary)' }}><i className="bi bi-flag me-2"></i>Statut</span>
                  <span style={{ fontWeight: 700, color: '#2980b9' }}>{selectedIncident.statut?.replace('_', ' ')}</span>
                </div>
                <div className="d-flex justify-content-between gap-3">
                  <span style={{ color: 'var(--eco-text-secondary)' }}><i className="bi bi-calendar me-2"></i>Date</span>
                  <span style={{ fontWeight: 600 }}>{new Date(selectedIncident.date).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              <Link to={`/signalements/${selectedIncident.id}`} className="btn-eco btn w-100 rounded-3 mt-4">
                Voir le dossier complet <i className="bi bi-arrow-right ms-2"></i>
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

export default MapPage
