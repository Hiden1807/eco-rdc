import axiosInstance from './axiosInstance'
import { unwrapList } from './normalizers'

export const getUsers = async () => {
  const response = await axiosInstance.get('users/')
  return unwrapList(response.data)
}

export const createOfficialUser = async (payload) => {
  const response = await axiosInstance.post('users/', payload)
  return response.data
}
