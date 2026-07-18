import axiosInstance from './axiosInstance'
import { normalizeMediaUrl, unwrapList } from './normalizers'

function normalizeNotification(item = {}) {
  const payload = item.payload || {}
  return {
    ...item,
    payload: {
      ...payload,
      photo: normalizeMediaUrl(payload.photo),
    },
  }
}

export const getNotifications = async () => {
  const response = await axiosInstance.get('notifications/')
  return unwrapList(response.data).map(normalizeNotification)
}

export const getUnreadNotificationCount = async () => {
  const response = await axiosInstance.get('notifications/unread_count/')
  return response.data?.count || 0
}

export const markNotificationRead = async (id) => {
  const response = await axiosInstance.post(`notifications/${id}/mark-read/`)
  return response.data
}

export const markAllNotificationsRead = async () => {
  const response = await axiosInstance.post('notifications/mark-all-read/')
  return response.data
}
