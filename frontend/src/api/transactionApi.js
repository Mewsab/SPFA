import axiosClient from './axiosClient'

function buildTransactionParams(filters = {}) {
  const params = {}

  if (filters.transaction_type) {
    params.transaction_type = filters.transaction_type
  }

  if (filters.category?.trim()) {
    params.category = filters.category.trim()
  }

  if (filters.date_from) {
    params.date_from = filters.date_from
  }

  if (filters.date_to) {
    params.date_to = filters.date_to
  }

  return params
}

export function getTransactions(filters = {}) {
  return axiosClient.get('/transactions/', {
    params: buildTransactionParams(filters),
  })
}

export function getTransactionSummary() {
  return axiosClient.get('/transactions/summary')
}

export function getTransactionTypes() {
  return axiosClient.get('/transactions/types')
}

export function getTransactionCategories() {
  return axiosClient.get('/transactions/categories')
}

export function createTransaction(payload) {
  return axiosClient.post('/transactions/', payload)
}

export function updateTransaction(transactionId, payload) {
  return axiosClient.put(`/transactions/${transactionId}`, payload)
}

export function deleteTransaction(transactionId) {
  return axiosClient.delete(`/transactions/${transactionId}`)
}
