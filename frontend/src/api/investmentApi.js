import axiosClient from './axiosClient'

export function getInvestmentOptions() {
  return axiosClient.get('/investments/options')
}

export function getInvestmentQuote(symbol) {
  return axiosClient.get(`/investments/quote/${symbol}`)
}

export function getInvestmentHistory(symbol) {
  return axiosClient.get(`/investments/history/${symbol}`)
}
