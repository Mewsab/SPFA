import axiosClient from './axiosClient'

export function registerUser(payload) {
  return axiosClient.post('/auth/register', payload)
}

export function loginUser(payload) {
  return axiosClient.post('/auth/login', payload)
}

export function getCurrentUser(config = {}) {
  return axiosClient.get('/auth/me', config)
}
