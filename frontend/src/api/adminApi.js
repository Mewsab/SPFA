import axiosClient from './axiosClient'

export function getAdminOverview() {
  return axiosClient.get('/admin/overview')
}

export function getAdminUsers() {
  return axiosClient.get('/admin/users')
}

export function updateAdminUserRole(userId, role) {
  return axiosClient.patch(`/admin/users/${userId}/role`, { role })
}

export function getAdminImportBatches() {
  return axiosClient.get('/admin/import-batches')
}
