import { useCallback, useEffect, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import DashboardLayout from '../components/layout/DashboardLayout'
import { getFinancialSummary } from '../api/insightApi'
import {
  getInvestmentHistory,
  getInvestmentOptions,
} from '../api/investmentApi'
import { removeToken } from '../utils/authStorage'
import { useNavigate } from 'react-router-dom'

const DEFAULT_OPTIONS = [
  { symbol: 'AAPL', name: 'Apple Inc.', asset_type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', asset_type: 'stock' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', asset_type: 'stock' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', asset_type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', asset_type: 'stock' },
]

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'OMR 0.000'
  }

  return `OMR ${Number(value).toFixed(3)}`
}

function formatMarketValue(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'Unavailable'
  }

  return Number(value).toFixed(2)
}

function Investments() {
  const navigate = useNavigate()
  const [recordedBalance, setRecordedBalance] = useState(0)
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [balanceMessage, setBalanceMessage] = useState('')
  const [options, setOptions] = useState([])
  const [selectedSymbol, setSelectedSymbol] = useState('')
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [optionsMessage, setOptionsMessage] = useState('')
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyMessage, setHistoryMessage] = useState('')

  const handleUnauthorized = useCallback(() => {
    removeToken()
    navigate('/login', {
      replace: true,
      state: { message: 'Your session expired. Please log in again.' },
    })
  }, [navigate])

  useEffect(() => {
    let ignore = false

    const loadBalance = async () => {
      try {
        setBalanceLoading(true)
        const response = await getFinancialSummary()

        if (ignore) {
          return
        }

        setRecordedBalance(Number(response.data?.balance || 0))
        setBalanceMessage('')
      } catch (error) {
        if (ignore) {
          return
        }

        if (error.response?.status === 401) {
          handleUnauthorized()
          return
        }

        setRecordedBalance(0)
        setBalanceMessage('Could not load recorded balance.')
      } finally {
        if (!ignore) {
          setBalanceLoading(false)
        }
      }
    }

    const loadOptions = async () => {
      try {
        setOptionsLoading(true)
        const response = await getInvestmentOptions()
        const loadedOptions = Array.isArray(response.data) && response.data.length > 0
          ? response.data
          : DEFAULT_OPTIONS

        if (ignore) {
          return
        }

        setOptions(loadedOptions)
        setSelectedSymbol(loadedOptions[0]?.symbol || 'AAPL')
        setOptionsMessage('')
      } catch (error) {
        if (ignore) {
          return
        }

        if (error.response?.status === 401) {
          handleUnauthorized()
          return
        }

        setOptions(DEFAULT_OPTIONS)
        setSelectedSymbol(DEFAULT_OPTIONS[0].symbol)
        setOptionsMessage('Could not load investment options.')
      } finally {
        if (!ignore) {
          setOptionsLoading(false)
        }
      }
    }

    void loadBalance()
    void loadOptions()

    return () => {
      ignore = true
    }
  }, [handleUnauthorized])

  useEffect(() => {
    if (!selectedSymbol) {
      return
    }

    let ignore = false

    const loadHistory = async () => {
      try {
        setHistoryLoading(true)
        setHistoryMessage('')
        const response = await getInvestmentHistory(selectedSymbol)
        const loadedHistory = Array.isArray(response.data?.history) ? response.data.history : []

        if (ignore) {
          return
        }

        setHistory(loadedHistory)
        if (loadedHistory.length === 0) {
          setHistoryMessage('Could not load price history.')
        }
      } catch (error) {
        if (ignore) {
          return
        }

        if (error.response?.status === 401) {
          handleUnauthorized()
          return
        }

        setHistory([])
        setHistoryMessage('Could not load price history.')
      } finally {
        if (!ignore) {
          setHistoryLoading(false)
        }
      }
    }

    void loadHistory()

    return () => {
      ignore = true
    }
  }, [handleUnauthorized, selectedSymbol])

  const chartData = history.map((point) => ({
    date: point.date,
    close: Number(point.close || 0),
  }))
  const hasHistory = chartData.length > 0

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        <section className="space-y-2">
          <h2 className="section-title">Investments</h2>
          <p className="section-copy text-sm leading-7 sm:text-base">
            View selected market options for educational awareness.
          </p>
        </section>

        {optionsMessage ? (
          <div
            className="rounded-lg border px-4 py-3 text-sm text-slate-200"
            style={{ borderColor: 'var(--spfa-border-accent)', background: 'rgba(15, 17, 23, 0.78)' }}
          >
            {optionsMessage}
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[0.85fr_1.45fr]">
          <div className="soft-panel px-5 py-5">
            <p className="text-sm font-medium text-slate-400">Recorded Balance</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {balanceLoading ? 'Loading...' : formatCurrency(recordedBalance)}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Based on your SPFA income minus expenses.
            </p>
            {balanceMessage ? <p className="mt-3 text-sm text-cyan-100">{balanceMessage}</p> : null}
          </div>

          <div className="soft-panel px-5 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Available Stocks</h3>
                <p className="mt-1 text-sm text-slate-400">Select a fixed stock option to view its trend chart.</p>
              </div>
              {optionsLoading ? <span className="text-sm text-slate-400">Loading options...</span> : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(options.length > 0 ? options : DEFAULT_OPTIONS).map((option) => {
                const isActive = option.symbol === selectedSymbol

                return (
                  <button
                    key={option.symbol}
                    type="button"
                    className="rounded-lg border px-4 py-2 text-sm font-semibold transition"
                    style={{
                      borderColor: isActive ? 'rgba(103, 232, 249, 0.35)' : 'rgba(103, 232, 249, 0.18)',
                      background: isActive ? 'rgba(103, 232, 249, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                      color: isActive ? '#ffffff' : '#cbd5e1',
                    }}
                    onClick={() => setSelectedSymbol(option.symbol)}
                  >
                    {option.symbol}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section>
          <div className="soft-panel px-5 py-5">
            <div className="flex flex-col gap-1 border-b pb-4" style={{ borderColor: 'var(--spfa-border)' }}>
              <h3 className="text-lg font-semibold text-white">Trend Chart</h3>
              <p className="text-sm text-slate-400">
                {historyLoading ? 'Loading price history...' : `${selectedSymbol || 'Selected asset'} daily close`}
              </p>
            </div>

            {historyMessage ? (
              <div
                className="mt-4 rounded-lg border px-4 py-3 text-sm text-slate-200"
                style={{ borderColor: 'rgba(103, 232, 249, 0.28)', background: 'rgba(103, 232, 249, 0.08)' }}
              >
                {historyMessage}
              </div>
            ) : null}

            {!hasHistory ? (
              <div
                className="mt-4 rounded-lg border px-5 py-12 text-sm leading-7 text-slate-300"
                style={{ borderColor: 'var(--spfa-border)', background: 'rgba(255, 255, 255, 0.03)' }}
              >
                Could not load price history.
              </div>
            ) : (
              <div className="mt-4 h-[320px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(148, 163, 184, 0.18)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      formatter={(value) => [formatMarketValue(value), 'Close']}
                      contentStyle={{
                        background: 'rgba(15, 17, 23, 0.96)',
                        border: '1px solid rgba(103, 232, 249, 0.32)',
                        borderRadius: '8px',
                        color: '#cbd5e1',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="close"
                      stroke="#67e8f9"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#67e8f9' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default Investments
