import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createBudget,
  deleteBudget,
  getBudgetCategories,
  getBudgetOverview,
  getBudgetPeriodTypes,
  updateBudget,
} from '../api/budgetApi'
import BudgetAlertBanner from '../components/budgets/BudgetAlertBanner'
import BudgetCategoryCards from '../components/budgets/BudgetCategoryCards'
import BudgetCharts from '../components/budgets/BudgetCharts'
import BudgetEmptyState from '../components/budgets/BudgetEmptyState'
import BudgetFilters from '../components/budgets/BudgetFilters'
import BudgetForm from '../components/budgets/BudgetForm'
import BudgetSummaryCards from '../components/budgets/BudgetSummaryCards'
import DashboardLayout from '../components/layout/DashboardLayout'
import { removeToken } from '../utils/authStorage'

const DEFAULT_BUDGET_CATEGORIES = [
  { label: 'Food', value: 'food' },
  { label: 'Transport', value: 'transport' },
  { label: 'Utilities', value: 'utilities' },
  { label: 'Salary', value: 'salary' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Education', value: 'education' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Savings', value: 'savings' },
  { label: 'Other', value: 'other' },
]

const DEFAULT_PERIOD_TYPES = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Custom', value: 'custom' },
]

const EMPTY_OVERVIEW = {
  budgets: [],
  total_budget_limit: 0,
  total_spent: 0,
  total_remaining: 0,
  exceeded_count: 0,
  near_limit_count: 0,
  total_projected_spending: 0,
  projected_remaining: 0,
  alert_count: 0,
  highest_risk_category: null,
  overall_budget_status: 'healthy',
  chart_data: [],
}

const INITIAL_FILTERS = {
  category: '',
  period_type: '',
  status: '',
}

function getApiErrorMessage(error, fallbackMessage) {
  const status = error.response?.status
  const detail = error.response?.data?.detail

  if (status === 400 && typeof detail === 'string') {
    return detail
  }

  if (status === 422) {
    return 'Please check your budget details and try again.'
  }

  if (typeof detail === 'string') {
    return detail
  }

  return fallbackMessage
}

function Budgets() {
  const navigate = useNavigate()
  const [budgetOverview, setBudgetOverview] = useState(EMPTY_OVERVIEW)
  const [budgetCategories, setBudgetCategories] = useState(DEFAULT_BUDGET_CATEGORIES)
  const [periodTypes, setPeriodTypes] = useState(DEFAULT_PERIOD_TYPES)
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [editingBudget, setEditingBudget] = useState(null)
  const [isLoadingOverview, setIsLoadingOverview] = useState(true)
  const [isSavingBudget, setIsSavingBudget] = useState(false)
  const [activeDeleteId, setActiveDeleteId] = useState(null)
  const [pageMessage, setPageMessage] = useState('')
  const [optionsMessage, setOptionsMessage] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [hasOverviewError, setHasOverviewError] = useState(false)

  const handleUnauthorized = useCallback(() => {
    removeToken()
    navigate('/login', {
      replace: true,
      state: { message: 'Your session expired. Please log in again.' },
    })
  }, [navigate])

  const loadOverview = useCallback(async () => {
    try {
      const response = await getBudgetOverview()
      setBudgetOverview(response.data || EMPTY_OVERVIEW)
      setHasOverviewError(false)
      setPageMessage('')
      return true
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized()
        return false
      }

      setBudgetOverview(EMPTY_OVERVIEW)
      setHasOverviewError(true)
      setPageMessage('Could not load budget overview.')
      return false
    } finally {
      setIsLoadingOverview(false)
    }
  }, [handleUnauthorized])

  useEffect(() => {
    let ignore = false

    const loadInitialOverview = async () => {
      try {
        const response = await getBudgetOverview()

        if (ignore) {
          return
        }

        setBudgetOverview(response.data || EMPTY_OVERVIEW)
        setHasOverviewError(false)
        setPageMessage('')
      } catch (error) {
        if (ignore) {
          return
        }

        if (error.response?.status === 401) {
          handleUnauthorized()
          return
        }

        setBudgetOverview(EMPTY_OVERVIEW)
        setHasOverviewError(true)
        setPageMessage('Could not load budget overview.')
      } finally {
        if (!ignore) {
          setIsLoadingOverview(false)
        }
      }
    }

    const loadOptions = async () => {
      try {
        const [categoriesResponse, periodTypesResponse] = await Promise.all([
          getBudgetCategories(),
          getBudgetPeriodTypes(),
        ])

        if (ignore) {
          return
        }

        setBudgetCategories(categoriesResponse.data.categories)
        setPeriodTypes(periodTypesResponse.data.period_types)
        setOptionsMessage('')
      } catch (error) {
        if (ignore) {
          return
        }

        if (error.response?.status === 401) {
          handleUnauthorized()
          return
        }

        setBudgetCategories(DEFAULT_BUDGET_CATEGORIES)
        setPeriodTypes(DEFAULT_PERIOD_TYPES)
        setOptionsMessage('Could not load budget options. Using available defaults instead.')
      }
    }

    void loadOptions()
    void loadInitialOverview()

    return () => {
      ignore = true
    }
  }, [handleUnauthorized])

  const filteredOverviewBudgets = useMemo(() => {
    const budgets = budgetOverview?.budgets || []

    return budgets.filter((budget) => {
      const matchesCategory = !filters.category || budget.category === filters.category
      const matchesPeriod = !filters.period_type || budget.period_type === filters.period_type
      const matchesStatus = !filters.status || budget.status === filters.status
      return matchesCategory && matchesPeriod && matchesStatus
    })
  }, [budgetOverview, filters])

  const filteredChartData = useMemo(() => {
    const allowedBudgetIds = new Set(filteredOverviewBudgets.map((budget) => budget.budget_id))
    const filteredCategories = new Set(filteredOverviewBudgets.map((budget) => budget.category))
    const chartData = budgetOverview?.chart_data || []

    if (allowedBudgetIds.size === 0) {
      return []
    }

    return chartData.filter((item) => filteredCategories.has(item.category))
  }, [budgetOverview, filteredOverviewBudgets])

  const handleFilterChange = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS)
  }

  const refreshBudgetData = useCallback(async () => {
    setIsLoadingOverview(true)
    await loadOverview()
  }, [loadOverview])

  const handleSubmitBudget = async (payload) => {
    try {
      setIsSavingBudget(true)
      setFormMessage('')
      setPageMessage('')

      if (editingBudget) {
        await updateBudget(editingBudget.budget_id, payload)
      } else {
        await createBudget(payload)
      }

      await refreshBudgetData()
      setEditingBudget(null)
      return true
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized()
        return false
      }

      setFormMessage(getApiErrorMessage(error, 'Could not save budget.'))
      return false
    } finally {
      setIsSavingBudget(false)
    }
  }

  const handleEditBudget = (budget) => {
    setEditingBudget(budget)
    setFormMessage('')
  }

  const handleCancelEdit = () => {
    setEditingBudget(null)
    setFormMessage('')
  }

  const handleDeleteBudget = async (budget) => {
    try {
      setActiveDeleteId(budget.budget_id)
      setPageMessage('')
      await deleteBudget(budget.budget_id)

      if (editingBudget?.budget_id === budget.budget_id) {
        setEditingBudget(null)
      }

      await refreshBudgetData()
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized()
        return
      }

      setPageMessage('Could not delete budget.')
    } finally {
      setActiveDeleteId(null)
    }
  }

  const hasAnyBudgets = (budgetOverview?.budgets || []).length > 0
  const hasActiveFilters = Boolean(filters.category || filters.period_type || filters.status)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="space-y-2">
          <h2 className="section-title">Budgets</h2>
          <p className="section-copy max-w-3xl text-sm leading-7 sm:text-base">
            Set spending limits, track category usage, and monitor your remaining budget.
          </p>
        </section>

        {pageMessage ? (
          <div
            className="rounded-xl border px-4 py-3 text-sm text-slate-200"
            style={{
              borderColor: 'rgba(103, 232, 249, 0.22)',
              background: 'rgba(15, 23, 42, 0.7)',
            }}
          >
            {pageMessage}
          </div>
        ) : null}

        {optionsMessage ? (
          <div
            className="rounded-xl border px-4 py-3 text-sm text-slate-200"
            style={{
              borderColor: 'rgba(103, 232, 249, 0.22)',
              background: 'rgba(15, 23, 42, 0.7)',
            }}
          >
            {optionsMessage}
          </div>
        ) : null}

        <BudgetAlertBanner overview={budgetOverview} />
        <BudgetSummaryCards overview={budgetOverview} isLoading={isLoadingOverview} />
        <BudgetCharts chartData={filteredChartData} />

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.5fr]">
          <BudgetForm
            key={editingBudget?.budget_id ?? 'create'}
            budgetCategories={budgetCategories}
            periodTypes={periodTypes}
            initialBudget={editingBudget}
            onSubmit={handleSubmitBudget}
            onCancelEdit={handleCancelEdit}
            isSubmitting={isSavingBudget}
            serverMessage={formMessage}
          />

          <BudgetFilters
            filters={filters}
            budgetCategories={budgetCategories}
            periodTypes={periodTypes}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </section>

        {!hasAnyBudgets && !isLoadingOverview && !hasOverviewError ? (
          <BudgetEmptyState />
        ) : hasAnyBudgets && filteredOverviewBudgets.length === 0 && !isLoadingOverview && !hasOverviewError ? (
          <div
            className="rounded-xl border px-6 py-10 text-center text-sm text-slate-400"
            style={{
              borderColor: 'rgba(103, 232, 249, 0.16)',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            {hasActiveFilters ? 'No budgets match the selected filters.' : 'No budgets to display.'}
          </div>
        ) : !hasOverviewError ? (
          <BudgetCategoryCards
            budgetCategories={budgetCategories}
            periodTypes={periodTypes}
            budgets={filteredOverviewBudgets}
            isLoading={isLoadingOverview}
            activeDeleteId={activeDeleteId}
            onEdit={handleEditBudget}
            onDelete={handleDeleteBudget}
          />
        ) : null}
      </div>
    </DashboardLayout>
  )
}

export default Budgets
