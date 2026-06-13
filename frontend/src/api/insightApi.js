import axiosClient from './axiosClient'

function buildFinancialSummaryParams(filters = {}) {
  const params = {}

  if (filters.source?.trim()) {
    params.source = filters.source.trim()
  }

  if (filters.import_batch_id) {
    params.import_batch_id = filters.import_batch_id
  }

  if (filters.date_from) {
    params.date_from = filters.date_from
  }

  if (filters.date_to) {
    params.date_to = filters.date_to
  }

  return params
}

export function getFinancialSummary(filters = {}) {
  return axiosClient.get('/insights/financial-summary', {
    params: buildFinancialSummaryParams(filters),
  })
}

export function generateAIAdvice(payload = {}) {
  return axiosClient.post('/insights/generate-advice', {
    source: payload.source ?? null,
    import_batch_id: payload.import_batch_id ?? null,
    date_from: payload.date_from ?? null,
    date_to: payload.date_to ?? null,
  })
}

export function getInsightHistory(limit = 10) {
  return axiosClient.get('/insights/history', {
    params: { limit },
  })
}

export function sendAIChatMessage(payload = {}) {
  return axiosClient.post('/insights/chat', {
    message: payload.message,
    source: payload.source ?? null,
    import_batch_id: payload.import_batch_id ?? null,
    date_from: payload.date_from ?? null,
    date_to: payload.date_to ?? null,
  })
}
