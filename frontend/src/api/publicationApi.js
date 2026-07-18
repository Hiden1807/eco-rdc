import axiosInstance from './axiosInstance'
import { normalizeMediaUrl, unwrapList } from './normalizers'

function normalizePublication(item = {}) {
  return {
    ...item,
    cover_image: normalizeMediaUrl(item.cover_image),
    attachment_pdf: normalizeMediaUrl(item.attachment_pdf),
    video_file: normalizeMediaUrl(item.video_file),
  }
}

export const getPublications = async (params = {}) => {
  const response = await axiosInstance.get('publications/', { params })
  return unwrapList(response.data).map(normalizePublication)
}

export const createPublication = async (payload) => {
  const hasFile = payload.cover_image || payload.attachment_pdf || payload.video_file
  if (hasFile) {
    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') formData.append(key, value)
    })
    // Laisser Axios/le navigateur definir le boundary garantit un upload lisible par Django.
    const response = await axiosInstance.post('publications/', formData)
    return normalizePublication(response.data)
  }
  const response = await axiosInstance.post('publications/', payload)
  return normalizePublication(response.data)
}
