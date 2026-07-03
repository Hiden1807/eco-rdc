// =============================================================
// src/pages/AIAnalysis.jsx — Page d'analyse d'images par Intelligence Artificielle
// Interface pour soumettre des photos d'incidents et recevoir une analyse
// =============================================================
import React, { useState, useRef } from 'react'
import { analyserIncident } from '../api/aiApi'

/**
 * AIAnalysis — Composant pour analyser les problèmes environnementaux via des images
 */
const AIAnalysis = () => {
  // États locaux
  const [image, setImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [selectedType, setSelectedType] = useState('depot_sauvage')
  
  // Référence pour l'input de fichier caché
  const fileInputRef = useRef(null)

  // Types d'incidents pour aider l'IA
  const incidentTypes = [
    { value: 'inondation', label: 'Inondation', icon: 'bi-water' },
    { value: 'depot_sauvage', label: 'Dépôt Sauvage', icon: 'bi-trash3' },
    { value: 'erosion', label: 'Érosion', icon: 'bi-exclamation-triangle' },
    { value: 'pollution', label: 'Pollution', icon: 'bi-droplet-half' },
  ]

  /**
   * handleImageSelect — Gère la sélection d'une image depuis l'ordinateur/téléphone
   */
  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      // Crée une URL locale pour afficher la prévisualisation
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setResult(null) // Réinitialise les résultats précédents
    }
  }

  /**
   * handleAnalyze — Lance l'analyse de l'image (appel API simulé)
   */
  const handleAnalyze = async () => {
    if (!image) return

    setIsAnalyzing(true)
    try {
      // 🔧 BACKEND-INTEGRATION: L'appel réel enverra le fichier binaire (FormData) au serveur Django.
      // Le backend (Django) utilisera un modèle (ex: TensorFlow, OpenCV ou API externe) pour analyser l'image.
      const analyseResult = await analyserIncident({
        type: selectedType,
        description: 'Analyse demandée via le module IA',
        // imageFile: image // Le backend aura besoin de ce fichier
      })
      
      setResult(analyseResult)
    } catch (error) {
      console.error("Erreur lors de l'analyse :", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  /**
   * resetAnalysis — Permet d'analyser une nouvelle image
   */
  const resetAnalysis = () => {
    setImage(null)
    setPreviewUrl(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
      
      {/* ---- EN-TÊTE DE LA PAGE ---- */}
      <div className="mb-4">
        <h1 style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--eco-text-primary)' }}>
          <i className="bi bi-robot me-3" style={{ color: 'var(--eco-accent)' }}></i>
          Intelligence Artificielle EcoRDC
        </h1>
        <p style={{ color: 'var(--eco-text-secondary)', fontSize: '1rem', marginTop: 8 }}>
          Soumettez une photo d'un problème environnemental. Notre modèle d'IA analysera l'image pour déterminer la gravité, la nature de l'incident, et proposera des recommandations immédiates.
        </p>
      </div>

      <div className="row g-4">
        {/* ==================== COLONNE GAUCHE : SÉLECTION IMAGE ==================== */}
        <div className="col-lg-6">
          <div className="eco-card p-4 h-100 d-flex flex-column">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>
              1. Téléchargez une photo
            </h3>

            {/* Input fichier caché */}
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/jpg" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageSelect}
            />

            {/* Zone d'affichage ou d'upload */}
            <div 
              className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center p-4"
              style={{
                border: '2px dashed var(--eco-border)',
                borderRadius: 16,
                background: previewUrl ? 'transparent' : 'rgba(0,0,0,0.02)',
                cursor: previewUrl ? 'default' : 'pointer',
                minHeight: 300,
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => !previewUrl && fileInputRef.current.click()}
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Aperçu" style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, objectFit: 'contain' }} />
                  {!isAnalyzing && !result && (
                    <button 
                      className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                      onClick={(e) => { e.stopPropagation(); resetAnalysis(); }}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--eco-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <i className="bi bi-cloud-arrow-up text-secondary" style={{ fontSize: '1.8rem' }}></i>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Cliquez pour uploader</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--eco-text-secondary)', margin: 0 }}>
                    Formats supportés : JPG, PNG (Max 5MB)
                  </p>
                </>
              )}
            </div>

            {/* Sélection du contexte (aide l'IA) */}
            <div className="mt-4">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--eco-text-secondary)', marginBottom: 10 }}>
                Contexte visuel (optionnel)
              </label>
              <div className="d-flex flex-wrap gap-2">
                {incidentTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className="btn btn-sm rounded-pill"
                    style={{
                      border: `1px solid ${selectedType === type.value ? 'var(--eco-accent)' : 'var(--eco-border)'}`,
                      background: selectedType === type.value ? 'var(--eco-accent-gradient)' : 'transparent',
                      color: selectedType === type.value ? '#fff' : 'var(--eco-text-primary)',
                    }}
                    disabled={isAnalyzing}
                  >
                    <i className={`bi ${type.icon} me-2`}></i>{type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bouton d'action principal */}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--eco-border)' }}>
              <button 
                className="btn-eco btn w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={handleAnalyze}
                disabled={!image || isAnalyzing || result !== null}
                style={{ height: 50 }}
              >
                {isAnalyzing ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Analyse par Réseaux de Neurones en cours...
                  </>
                ) : result ? (
                  <>
                    <i className="bi bi-check-circle"></i> Analyse Terminée
                  </>
                ) : (
                  <>
                    <i className="bi bi-magic"></i> Lancer l'Analyse IA
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ==================== COLONNE DROITE : RÉSULTATS IA ==================== */}
        <div className="col-lg-6">
          <div className="eco-card p-4 h-100" style={{ background: result ? 'var(--eco-bg-card)' : 'rgba(0,0,0,0.01)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>
              2. Résultats & Recommandations
            </h3>

            {!result && !isAnalyzing && (
              <div className="d-flex flex-column align-items-center justify-content-center text-center h-75 opacity-50">
                <i className="bi bi-robot" style={{ fontSize: '3rem', marginBottom: 16 }}></i>
                <p style={{ fontSize: '0.9rem' }}>Les résultats du modèle de reconnaissance d'image s'afficheront ici.</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="d-flex flex-column align-items-center justify-content-center text-center h-75 animate-fade-in">
                <div className="eco-spinner mb-4"></div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Traitement de l'image...</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--eco-text-secondary)' }}>
                  Extraction des caractéristiques visuelles et estimation de la gravité.
                </p>
              </div>
            )}

            {result && (
              <div className="animate-fade-in-up">
                {/* Score de confiance et gravité */}
                <div className="d-flex gap-3 mb-4">
                  <div className="flex-grow-1 p-3 rounded-4" style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#27ae60', fontWeight: 700, textTransform: 'uppercase' }}>Confiance IA</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--eco-text-primary)' }}>{result.confiance}%</div>
                  </div>
                  <div className="flex-grow-1 p-3 rounded-4" style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#e74c3c', fontWeight: 700, textTransform: 'uppercase' }}>Niveau Gravité</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--eco-text-primary)' }}>{result.gravite} / 5</div>
                  </div>
                </div>

                {/* Rapport textuel */}
                <div className="mb-4">
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--eco-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Diagnostic Visuel
                  </h4>
                  <div className="p-3 rounded-3" style={{ background: 'var(--eco-bg-primary)', border: '1px solid var(--eco-border)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    {result.analyse}
                  </div>
                </div>

                {/* Recommandations */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--eco-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                    Recommandations d'Action
                  </h4>
                  <ul className="list-unstyled d-flex flex-column gap-2">
                    {result.recommandations.map((rec, i) => (
                      <li key={i} className="d-flex align-items-start gap-2 p-2 rounded-3" style={{ background: 'rgba(243,156,18,0.1)' }}>
                        <i className="bi bi-lightbulb-fill text-warning mt-1"></i>
                        <span style={{ fontSize: '0.9rem' }}>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Bouton Nouvelle Analyse */}
                <div className="mt-4 pt-3 text-end" style={{ borderTop: '1px solid var(--eco-border)' }}>
                   <button onClick={resetAnalysis} className="btn btn-outline-secondary rounded-pill btn-sm px-4">
                     Analyser une autre image
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default AIAnalysis
