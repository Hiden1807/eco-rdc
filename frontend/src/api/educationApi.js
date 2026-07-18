import axiosInstance from './axiosInstance'
import { unwrapList } from './normalizers'

export const getEducationContents = async (params = {}) => {
  const response = await axiosInstance.get('education/', { params })
  return unwrapList(response.data)
}

export const createEducationContent = async (payload) => {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') formData.append(key, value)
  })
  const response = await axiosInstance.post('education/', formData)
  return response.data
}
