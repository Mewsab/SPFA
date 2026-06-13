import axiosClient from './axiosClient'

function triggerBlobDownload(blob, fileName) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export function uploadTransactionsCsv(file) {
  const formData = new FormData()
  formData.append('file', file)

  return axiosClient.post('/imports/transactions-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export async function downloadCsvTemplate() {
  const response = await axiosClient.get('/imports/template', {
    responseType: 'blob',
  })
  triggerBlobDownload(response.data, 'spfa_transactions_template.csv')
  return response
}

export async function downloadSampleCsv(rows = 30) {
  const response = await axiosClient.get('/imports/sample-csv', {
    params: { rows },
    responseType: 'blob',
  })
  triggerBlobDownload(response.data, 'spfa_sample_transactions.csv')
  return response
}
