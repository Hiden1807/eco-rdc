import axiosInstance from './axiosInstance'
import { unwrapList } from './normalizers'

export const getReports = async () => {
  const response = await axiosInstance.get('reports/')
  return unwrapList(response.data)
}

export const generateReport = async (payload) => {
  const response = await axiosInstance.post('reports/generate/', payload)
  return response.data
}
