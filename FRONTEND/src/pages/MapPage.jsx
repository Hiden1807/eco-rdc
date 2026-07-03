// =============================================================
// src/pages/MapPage.jsx — Carte SIG plein écran Leaflet (window.L)
// Incidentes géolocalisés de Kinshasa avec filtres par communes
// ⚠️ Leaflet est chargé via CDN dans index.html — accès via window.L
// =============================================================
import React, { useEffect, useRef, useState } from 'react'
import { getMapIncidents, COMMUNES_COORDS } from '../api/mapApi'
import { COMMUNES_KINSHASA, TYPES_INCIDENT } from '../api/signalementApi'
import { InlineLoader } from '../components/Loader'

// Couleurs des marqueurs selon la gravité de l'incident
const GRAVITE_COLORS = {
  1: '#27ae60', 2: '#f39c12', 3: '#e67e22', 4: '#e74c3c', 5: '#922b21'
}

// Types d'incident avec emoji pour les popups
const TYPE_EMOJIS = {
  inondation: '🌊', depot_sauvage: '🗑️', erosion: '⛰️',
  brulage: '🔥', pollution: '☣️', debris: '🧱',
}

// URLs des fonds de carte
const MAP_LAYERS = {
  light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
}

const MapPage = () => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersGroupRef = useRef(null)
  const tileLayerRef = useRef(null)

  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [communeFiltre, setCommuneFiltre] = useState('')
  const [typeFiltre, setTypeFiltre] = useState('')
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [mapTheme, setMapTheme] = useState('light') // 'light' ou 'dark'

  useEffect(() => {
    if (!window.L) {
      console.error('Leaflet non disponible — vérifiez le CDN dans index.html')
      return
    }
    if (mapInstanceRef.current) return

    const map = window.L.map(mapRef.current, {
      center: [-4.3225, 15.3222], // Kinshasa
      zoom: 12,
      zoomControl: false,
    })

    window.L.control.zoom({ position: 'bottomright' }).addTo(map)

    tileLayerRef.current = window.L.tileLayer(MAP_LAYERS.light, {
      attribution: '© OpenStreetMap | © CartoDB',
      maxZoom: 19,
    }).addTo(map)

    markersGroupRef.current = window.L.layerGroup().addTo(map)
    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Change le fond de carte dynamiquement
  useEffect(() => {
    if (tileLayerRef.current && mapInstanceRef.current) {
      tileLayerRef.current.setUrl(MAP_LAYERS[mapTheme])
    }
  }, [mapTheme])

  useEffect(() => {
    const fetchAndRender = async () => {
      setLoading(true)
      try {
        const data = await getMapIncidents({ commune: communeFiltre, type: typeFiltre })
        setIncidents(data)
        renderMarkers(data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchAndRender()
  }, [communeFiltre, typeFiltre])

  const renderMarkers = (data) => {
    if (!markersGroupRef.current || !window.L) return
    markersGroupRef.current.clearLayers()

    data.forEach((incident) => {
      const color = GRAVITE_COLORS[incident.gravite] || '#888'
      const emoji = TYPE_EMOJIS[incident.type] || '📍'

      const icon = window.L.divIcon({
        html: `
          <div style="
            width: 40px; height: 40px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            background: ${color};
            border: 3px solid #fff;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s;
          " class="marker-eco">
            <span style="transform: rotate(45deg); font-size: 1.1rem;">${emoji}</span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        className: '',
      })

      const marker = window.L.marker([incident.lat, incident.lng], { icon })
        .addTo(markersGroupRef.current)

      marker.on('click', () => {
        setSelectedIncident(incident)
        setPanelOpen(true)
        mapInstanceRef.current.setView([incident.lat, incident.lng], 15, { animate: true, duration: 1 })
      })
    })
  }

  const flyToCommune = (commune) => {
    const coords = COMMUNES_COORDS[commune]
    if (coords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coords.lat, coords.lng], 14, { duration: 1.5 })
    }
  }

  return (
    <div style={{ height: 'calc(100vh - 62px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ==================== BARRE DE FILTRES ==================== */}
      <div
        className="glass-panel"
        style={{
          borderBottom: '1px solid var(--eco-border)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          zIndex: 10,
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <div style={{ width: 36, height: 36, background: 'var(--eco-accent-gradient)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-geo-alt-fill text-white"></i>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--eco-text-primary)' }}>SIG Kinshasa</span>
        </div>

        {/* Filtre par commune */}
        <select
          value={communeFiltre}
          onChange={(e) => { setCommuneFiltre(e.target.value); flyToCommune(e.target.value) }}
          className="eco-input"
          style={{ height: 42, width: '220px', padding: '0 12px' }}
        >
          <option value="">📍 Toutes les communes</option>
          {COMMUNES_KINSHASA.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Filtre par type */}
        <select
          value={typeFiltre}
          onChange={(e) => setTypeFiltre(e.target.value)}
          className="eco-input"
          style={{ height: 42, width: '220px', padding: '0 12px' }}
        >
          <option value="">🗂️ Tous les types</option>
          {TYPES_INCIDENT.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        {/* Thème de carte */}
        <div className="ms-auto d-flex align-items-center gap-2">
          <button onClick={() => setMapTheme('light')} className="btn btn-sm" style={{ background: mapTheme === 'light' ? 'var(--eco-accent)' : 'transparent', color: mapTheme === 'light' ? '#fff' : 'var(--eco-text-secondary)', border: '1px solid var(--eco-border)', borderRadius: 8 }}>
            <i className="bi bi-sun-fill"></i> Clair
          </button>
          <button onClick={() => setMapTheme('dark')} className="btn btn-sm" style={{ background: mapTheme === 'dark' ? 'var(--eco-accent)' : 'transparent', color: mapTheme === 'dark' ? '#fff' : 'var(--eco-text-secondary)', border: '1px solid var(--eco-border)', borderRadius: 8 }}>
            <i className="bi bi-moon-fill"></i> Sombre
          </button>
        </div>
      </div>

      {/* ==================== CARTE PRINCIPALE ==================== */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} id="eco-map" style={{ width: '100%', height: '100%', borderRadius: 0 }} />

        {/* OVERLAY STATISTIQUES RAPIDES */}
        <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 900 }} className="animate-fade-in-up">
          <div className="glass-card p-3 d-flex align-items-center gap-3" style={{ borderRadius: 16 }}>
            <div style={{ width: 48, height: 48, background: 'rgba(39,174,96,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading ? <InlineLoader size="sm" /> : <span style={{ fontWeight: 800, color: '#27ae60', fontSize: '1.2rem' }}>{incidents.length}</span>}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--eco-text-primary)' }}>Incidents Affichés</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)' }}>Mise à jour en temps réel</div>
            </div>
          </div>
        </div>

        {/* ---- PANNEAU LATÉRAL DE DÉTAIL ---- */}
        {panelOpen && selectedIncident && (
          <div
            className="animate-fade-in glass-card"
            style={{
              position: 'absolute', top: 20, right: 20,
              width: 320,
              borderRadius: 20,
              boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            <div style={{ background: 'var(--eco-accent-gradient)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{TYPE_EMOJIS[selectedIncident.type]}</span> {selectedIncident.titre}
              </span>
              <button onClick={() => setPanelOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bi bi-x-lg"></i></button>
            </div>
            
            <div style={{ padding: 20 }}>
              <div className="d-flex flex-column gap-3" style={{ fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--eco-border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--eco-text-secondary)' }}><i className="bi bi-geo-alt me-2"></i>Commune</span>
                  <span style={{ fontWeight: 700, color: 'var(--eco-text-primary)' }}>{selectedIncident.commune}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--eco-border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--eco-text-secondary)' }}><i className="bi bi-exclamation-triangle me-2"></i>Gravité</span>
                  <span style={{ fontWeight: 800, color: GRAVITE_COLORS[selectedIncident.gravite] }}>Niveau {selectedIncident.gravite}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--eco-border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--eco-text-secondary)' }}><i className="bi bi-flag me-2"></i>Statut</span>
                  <span style={{ fontWeight: 700, background: 'rgba(41,128,185,0.1)', color: '#2980b9', padding: '2px 8px', borderRadius: 8 }}>{selectedIncident.statut.replace('_', ' ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--eco-text-secondary)' }}><i className="bi bi-calendar me-2"></i>Signalé le</span>
                  <span style={{ fontWeight: 600 }}>{new Date(selectedIncident.date).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              <a
                href={`/signalements/${selectedIncident.id}`}
                className="btn-eco btn w-100 rounded-3 mt-4"
              >
                Voir les détails complets <i className="bi bi-arrow-right ms-2"></i>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MapPage
