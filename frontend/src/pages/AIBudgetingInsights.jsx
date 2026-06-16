import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import AIAdviceCard from '../components/insights/AIAdviceCard'
import AICoachChat from '../components/insights/AICoachChat'
import CSVUploadCard from '../components/insights/CSVUploadCard'
import FinancialHealthBanner from '../components/insights/FinancialHealthBanner'
import FinancialSummaryCards from '../components/insights/FinancialSummaryCards'
import ImportResultCard from '../components/insights/ImportResultCard'
import IncomeExpenseChart from '../components/insights/IncomeExpenseChart'
import InsightHistoryList from '../components/insights/InsightHistoryList'
import InsightEmptyState from '../components/insights/InsightEmptyState'
import SmartBudgetSuggestions from '../components/insights/SmartBudgetSuggestions'
import SpendingBreakdownChart from '../components/insights/SpendingBreakdownChart'
import { generateAIAdvice, getFinancialSummary, getInsightHistory } from '../api/insightApi'
import { removeToken } from '../utils/authStorage'

function getApiErrorMessage(error, fallbackMessage) {
  const detail = error.response?.data?.detail

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(' ')
  }

  return fallbackMessage
}

function getAIAdviceErrorMessage(error) {
  if (error.response?.status === 400) {
    return 'Add transactions or upload a CSV statement before generating AI advice.'
  }

  if (error.response?.status === 503) {
    return 'AI advice is currently unavailable. Check API key, credits, or service availability.'
  }

  return 'Could not generate AI budgeting advice. Please try again.'
}

function AIBudgetingInsights() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [aiAdvice, setAIAdvice] = useState(null)
  const [insightHistory, setInsightHistory] = useState([])
  const [isLoadingSummary, setIsLoadingSummary] = useState(true)
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false)
  const [pageMessage, setPageMessage] = useState('')
  const [adviceError, setAdviceError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [coachResetKey, setCoachResetKey] = useState(0)

  const handleUnauthorized = useCallback(() => {
    removeToken()
    navigate('/login', {
      replace: true,
      state: { message: 'Your session expired. Please log in again.' },
    })
  }, [navigate])

  const loadFinancialSummary = useCallback(async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) {
        setIsLoadingSummary(true)
        setPageMessage('')
      }
      const response = await getFinancialSummary()
      setSummary(response.data)
      setPageMessage('')
      return true
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized()
        return false
      }

      setSummary(null)
      setPageMessage(getApiErrorMessage(error, 'Could not load financial insights.'))
      return false
    } finally {
      setIsLoadingSummary(false)
    }
  }, [handleUnauthorized])

  const loadInsightHistory = useCallback(async () => {
    try {
      const response = await getInsightHistory(10)
      setInsightHistory(response.data || [])
      setHistoryError('')
      return true
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized()
        return false
      }

      setHistoryError('Could not load previous insights.')
      return false
    }
  }, [handleUnauthorized])

  useEffect(() => {
    let ignore = false

    const loadInitialSummary = async () => {
      try {
        const response = await getFinancialSummary()

        if (ignore) {
          return
        }

        setSummary(response.data)
        setPageMessage('')
      } catch (error) {
        if (ignore) {
          return
        }

        if (error.response?.status === 401) {
          handleUnauthorized()
          return
        }

        setSummary(null)
        setPageMessage(getApiErrorMessage(error, 'Could not load financial insights.'))
      } finally {
        if (!ignore) {
          setIsLoadingSummary(false)
        }
      }
    }

    void loadInitialSummary()
    void getInsightHistory(10)
      .then((response) => {
        if (ignore) {
          return
        }

        setInsightHistory(response.data || [])
        setHistoryError('')
      })
      .catch((error) => {
        if (ignore) {
          return
        }

        if (error.response?.status === 401) {
          handleUnauthorized()
          return
        }

        setHistoryError('Could not load previous insights.')
      })

    return () => {
      ignore = true
    }
  }, [handleUnauthorized])

  const handleImportSuccess = async (result) => {
    setImportResult(result)
    setAIAdvice(null)
    setAdviceError('')
    setCoachResetKey((current) => current + 1)
    await loadFinancialSummary()
  }

  const handleGenerateAIAdvice = async () => {
    try {
      setIsGeneratingAdvice(true)
      setAdviceError('')
      setAIAdvice(null)

      const response = await generateAIAdvice({
        source: null,
        import_batch_id: null,
        date_from: null,
        date_to: null,
      })

      setAIAdvice(response.data)
      await loadInsightHistory()
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized()
        return
      }

      setAdviceError(getAIAdviceErrorMessage(error))
    } finally {
      setIsGeneratingAdvice(false)
    }
  }

  const hasNoData = !isLoadingSummary && Number(summary?.transaction_count || 0) === 0

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        <section className="space-y-2">
          <h2 className="section-title">AI Budgeting Insights</h2>
          <p className="section-copy text-sm leading-7 sm:text-base">
            Upload financial activity, review spending analysis, and receive suggested budgeting strategies.
          </p>
        </section>

        {pageMessage ? (
          <div
            className="rounded-xl border px-4 py-3 text-sm text-slate-200"
            style={{
              borderColor: 'rgba(244, 63, 94, 0.28)',
              background: 'rgba(244, 63, 94, 0.08)',
            }}
          >
            {pageMessage}
          </div>
        ) : null}

        <section className="space-y-5">
          <div className="grid items-stretch gap-5 xl:grid-cols-2">
            <FinancialHealthBanner summary={summary} />

            <CSVUploadCard
              onImportSuccess={handleImportSuccess}
              onUnauthorized={handleUnauthorized}
            />
          </div>

          <ImportResultCard result={importResult} />

          {hasNoData ? <InsightEmptyState /> : null}
        </section>

        <section className="soft-panel px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-1 border-b pb-4" style={{ borderColor: 'var(--spfa-border)' }}>
            <h3 className="text-lg font-semibold text-white">Analytics Overview</h3>
            <p className="text-sm text-slate-400">Charts and core financial metrics from your current activity.</p>
          </div>

          <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.9fr)] 2xl:grid-cols-[minmax(0,2.2fr)_minmax(300px,0.85fr)]">
            <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
              <SpendingBreakdownChart data={summary?.spending_chart_data || []} embedded />
              <IncomeExpenseChart data={summary?.income_expense_chart_data || []} embedded />
            </div>

            <FinancialSummaryCards summary={summary} isLoading={isLoadingSummary} />
          </div>
        </section>

        <SmartBudgetSuggestions suggestions={summary?.budget_suggestions || []} />

        <section
          className="soft-panel px-4 py-4 sm:px-5"
          style={{ borderColor: 'var(--spfa-border-accent)' }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">AI Budgeting Advice</h3>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                Generate a practical coaching summary from your current financial summary. The AI receives compact totals,
                category spending, and smart budget suggestions rather than raw CSV rows.
              </p>
            </div>

            <button
              type="button"
              className="primary-button shrink-0 px-4 py-3"
              onClick={handleGenerateAIAdvice}
              disabled={isGeneratingAdvice}
            >
              {isGeneratingAdvice ? 'Generating...' : 'Generate AI Budgeting Advice'}
            </button>
          </div>

          {isGeneratingAdvice ? (
            <div
              className="mt-5 rounded-lg border px-4 py-4 text-sm text-cyan-100"
              style={{ borderColor: 'var(--spfa-border-accent)', background: 'rgba(103, 232, 249, 0.08)' }}
            >
              Generating personalized budgeting advice...
            </div>
          ) : null}

          {adviceError ? (
            <div
              className="mt-5 rounded-lg border px-4 py-3 text-sm text-slate-200"
              style={{
                borderColor: 'rgba(244, 63, 94, 0.28)',
                background: 'rgba(244, 63, 94, 0.08)',
              }}
            >
              {adviceError}
            </div>
          ) : null}

          <AIAdviceCard advice={aiAdvice} />
        </section>

        <AICoachChat key={coachResetKey} onUnauthorized={handleUnauthorized} />

        <InsightHistoryList history={insightHistory} errorMessage={historyError} />
      </div>
    </DashboardLayout>
  )
}

export default AIBudgetingInsights
