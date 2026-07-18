import React, { useEffect } from 'react'

const ImagePreviewModal = ({ src, alt = 'Image', onClose }) => {
  useEffect(() => {
    if (!src) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [src, onClose])

  if (!src) return null

  return (
    <div className="eco-media-preview-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="eco-media-preview-panel" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="eco-media-preview-close" onClick={onClose} aria-label="Fermer">
          <i className="bi bi-x-lg"></i>
        </button>
        <img src={src} alt={alt} />
      </div>
    </div>
  )
}

export default ImagePreviewModal
