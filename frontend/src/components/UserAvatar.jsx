import React, { useState } from 'react'
import ImagePreviewModal from './ImagePreviewModal'

const UserAvatar = ({
  user,
  src,
  name,
  size = 36,
  preview = true,
  className = '',
  title = 'Voir la photo de profil',
}) => {
  const [open, setOpen] = useState(false)
  const image = src || user?.avatar || ''
  const label = name || user?.name || user?.username || user?.email || 'Utilisateur'
  const initial = label?.charAt(0)?.toUpperCase() || 'U'
  const canPreview = preview && Boolean(image)
  const content = (
    <span
      className={`eco-avatar ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.36) }}
    >
      {image ? <img src={image} alt={label} /> : <span>{initial}</span>}
    </span>
  )

  return (
    <>
      {canPreview ? (
        <button
          type="button"
          className="eco-avatar-button"
          title={title}
          aria-label={title}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setOpen(true)
          }}
        >
          {content}
        </button>
      ) : content}
      <ImagePreviewModal src={open ? image : ''} alt={label} onClose={() => setOpen(false)} />
    </>
  )
}

export default UserAvatar
