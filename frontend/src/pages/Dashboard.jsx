import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import TransactionSummaryCards from '../components/transactions/TransactionSummaryCards'
import { getTransactionSummary, getTransactions } from '../api/transactionApi'
import { removeToken } from '../utils/authStorage'
import { useNavigate } from 'react-router-dom'

function getApiErrorMessage(error, fallbackMessage) {
  const detail = error.response?.data?.detail

  if (typeof detail === 'string') {
    return detail
  }

  return fallbackMessage
}

function formatCategoryLabel(category) {
  if (!category) {
    return 'Other'
  }

  return category.charAt(0).toUpperCase() + category.slice(1)
}

function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
    transaction_count: 0,
  })
  const [recentTransactions, setRecentTransactions] = useState([])
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [recentLoading, setRecentLoading] = useState(true)
  const [pageMessage, setPageMessage] = useState('')

  const handleUnauthorized = useCallback(() => {
    removeToken()
    navigate('/login', {
      replace: true,
      state: { message: 'Your session expired. Please log in again.' },
    })
  }, [navigate])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setSummaryLoading(true)
        setRecentLoading(true)
        setPageMessage('')

        const [summaryResponse, transactionsResponse] = await Promise.all([
          getTransactionSummary(),
          getTransactions(),
        ])

        setSummary(summaryResponse.data)
        setRecentTransactions(transactionsResponse.data.slice(0, 4))
      } catch (error) {
        if (error.response?.status === 401) {
          handleUnauthorized()
          return
        }

        setSummary({
          total_income: 0,
          total_expense: 0,
          balance: 0,
          transaction_count: 0,
        })
        setRecentTransactions([])
        setPageMessage(getApiErrorMessage(error, 'Could not load dashboard data.'))
      } finally {
        setSummaryLoading(false)
        setRecentLoading(false)
      }
    }

    void loadDashboardData()
  }, [handleUnauthorized])

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        <section className="soft-panel px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span
                className="inline-flex rounded-full border px-3 py-1 text-sm font-semibold uppercase tracking-wide text-cyan-100"
                style={{ borderColor: 'var(--spfa-border-accent)', background: 'var(--spfa-accent)' }}
              >
                Personal finance workspace
              </span>
              <div className="space-y-2">
                <h2 className="section-title">User Dashboard</h2>
                <p className="section-copy text-sm leading-7 sm:text-base">
                  Track your financial activity and prepare your workspace for smarter insights over time.
                </p>
              </div>
            </div>
            <div className="rounded-lg border px-5 py-4 text-slate-100" style={{ borderColor: 'var(--spfa-border)', background: 'var(--spfa-surface-strong)' }}>
              <p className="text-sm font-medium text-slate-400">Workspace status</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {summary.transaction_count > 0 ? 'Tracking transaction activity' : 'Ready for your first entries'}
              </p>
            </div>
          </div>
        </section>

        {pageMessage ? (
          <div
            className="rounded-xl border px-4 py-3 text-sm text-slate-200"
            style={{
              borderColor: 'var(--spfa-border-accent)',
              background: 'rgba(15, 17, 23, 0.78)',
            }}
          >
            {pageMessage}
          </div>
        ) : null}

        <TransactionSummaryCards summary={summary} isLoading={summaryLoading} />

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="soft-panel px-6 py-6">
            <div>
              <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
              <p className="mt-1 text-sm text-slate-400">
                Your latest recorded income and expenses appear here.
              </p>
            </div>

            {recentLoading ? (
              <div className="mt-6 rounded-lg border px-5 py-8 text-sm leading-7 text-slate-300" style={{ borderColor: 'var(--spfa-border)', background: 'rgba(255, 255, 255, 0.03)' }}>
                Loading recent activity...
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="mt-6 rounded-lg border px-5 py-8 text-sm leading-7 text-slate-300" style={{ borderColor: 'var(--spfa-border)', background: 'rgba(255, 255, 255, 0.03)' }}>
                No recent activity yet. Your transactions will appear here once added.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.transaction_id}
                    className="flex flex-col gap-3 rounded-lg border px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{
                      borderColor: 'var(--spfa-border)',
                      background: 'rgba(255, 255, 255, 0.03)',
                    }}
                  >
                    <div>
                      <p className="font-medium text-white">{formatCategoryLabel(transaction.category)}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {transaction.transaction_date}
                        {transaction.description ? ` - ${transaction.description}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                        style={{
                          borderColor:
                            transaction.transaction_type === 'income'
                              ? 'rgba(34, 197, 94, 0.28)'
                              : 'rgba(244, 63, 94, 0.28)',
                          background:
                            transaction.transaction_type === 'income'
                              ? 'rgba(34, 197, 94, 0.08)'
                              : 'rgba(244, 63, 94, 0.08)',
                          color:
                            transaction.transaction_type === 'income'
                              ? '#86efac'
                              : '#fb7185',
                        }}
                      >
                        {transaction.transaction_type === 'income' ? 'Income' : 'Expense'}
                      </span>
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color:
                            transaction.transaction_type === 'income'
                              ? '#22c55e'
                              : '#f43f5e',
                        }}
                      >
                        {transaction.transaction_type === 'income' ? '+' : '-'} OMR{' '}
                        {Number(transaction.amount || 0).toFixed(3)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="soft-panel px-6 py-6">
            <div className="flex items-center gap-3">
              <div
                className="rounded-lg p-3 text-cyan-200"
                style={{ background: 'var(--spfa-accent)', border: '1px solid var(--spfa-border-accent)' }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Smart Budget Tip</h3>
                <p className="mt-1 text-sm text-slate-400">Review your latest AI budgeting insights.</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border p-5" style={{ borderColor: 'var(--spfa-border)', background: 'rgba(255, 255, 255, 0.03)' }}>
              <p className="text-sm leading-7 text-slate-300">
                Review your latest AI budgeting insights based on your transactions and CSV imports.
              </p>
              <button
                type="button"
                className="secondary-button mt-5 gap-2 px-4 py-3"
                onClick={() => navigate('/ai-budgeting-insights')}
              >
                <ArrowUpRight size={16} />
                <span>Open AI Insights</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
