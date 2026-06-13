import { CalendarDays, PencilLine, Trash2, TrendingUp } from 'lucide-react'
import BudgetProgressBar from './BudgetProgressBar'
import BudgetStatusBadge from './BudgetStatusBadge'

const amountFormatter = new Intl.NumberFormat('en-OM', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatCurrency(amount) {
  return `OMR ${amountFormatter.format(Number(amount || 0))}`
}

function formatOptionLabel(value, options) {
  return options.find((option) => option.value === value)?.label || value || 'Unknown'
}

function getForecastCopy(forecastStatus) {
  if (forecastStatus === 'risk') {
    return 'Projected to exceed budget'
  }

  if (forecastStatus === 'watch') {
    return 'Projected close to limit'
  }

  return 'Forecast looks safe'
}

function BudgetCategoryCards({
  budgetCategories,
  periodTypes,
  budgets,
  isLoading = false,
  activeDeleteId = null,
  onEdit,
  onDelete,
}) {
  const handleDelete = (budget) => {
    const categoryLabel = formatOptionLabel(budget.category, budgetCategories)
    const confirmed = window.confirm(
      `Delete the ${categoryLabel} budget from ${budget.start_date} to ${budget.end_date}?`,
    )

    if (confirmed) {
      onDelete(budget)
    }
  }

  if (isLoading) {
    return (
      <section className="soft-panel p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-white">Category Budgets</h3>
        <p className="mt-5 text-sm text-slate-400">Loading budget cards...</p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-white">Category Budgets</h3>
        <p className="mt-1 text-sm text-slate-400">
          Review budget usage, forecast risk, and category-specific alerts.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {budgets.map((budget) => {
          const categoryLabel = formatOptionLabel(budget.category, budgetCategories)
          const periodLabel = formatOptionLabel(budget.period_type, periodTypes)
          const isDeleting = activeDeleteId === budget.budget_id
          const showAlert = ['warning', 'danger'].includes(budget.alert_level)
          const forecastRiskColor = budget.forecast_status === 'risk'
            ? '#f43f5e'
            : budget.forecast_status === 'watch'
              ? '#f59e0b'
              : '#22c55e'

          return (
            <article
              key={budget.budget_id}
              className="rounded-2xl border p-5"
              style={{
                borderColor: 'rgba(103, 232, 249, 0.20)',
                background: 'rgba(255, 255, 255, 0.03)',
                boxShadow: '0 18px 40px rgba(2, 6, 23, 0.2)',
              }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{categoryLabel}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                    <span>{periodLabel}</span>
                    <span className="text-slate-600">/</span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={14} />
                      {budget.start_date} to {budget.end_date}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <BudgetStatusBadge status={budget.status} />
                  <BudgetStatusBadge status={budget.forecast_status} />
                </div>
              </div>

              {showAlert ? (
                <div
                  className="mt-5 rounded-xl border px-4 py-3 text-sm leading-6"
                  style={{
                    borderColor: budget.alert_level === 'danger'
                      ? 'rgba(244, 63, 94, 0.28)'
                      : 'rgba(245, 158, 11, 0.28)',
                    background: budget.alert_level === 'danger'
                      ? 'rgba(244, 63, 94, 0.10)'
                      : 'rgba(245, 158, 11, 0.10)',
                    color: budget.alert_level === 'danger' ? '#fecdd3' : '#fde68a',
                  }}
                >
                  {budget.alert_message}
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Limit</p>
                  <p className="mt-1 font-semibold text-white">{formatCurrency(budget.limit_amount)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Spent</p>
                  <p className="mt-1 font-semibold" style={{ color: '#f59e0b' }}>
                    {formatCurrency(budget.spent_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Remaining</p>
                  <p
                    className="mt-1 font-semibold"
                    style={{ color: Number(budget.remaining_amount || 0) < 0 ? '#f43f5e' : '#22c55e' }}
                  >
                    {formatCurrency(budget.remaining_amount)}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <BudgetProgressBar value={budget.usage_percentage} status={budget.status} />
              </div>

              <div
                className="mt-5 grid gap-3 rounded-xl border p-4 sm:grid-cols-2"
                style={{
                  borderColor: 'rgba(103, 232, 249, 0.14)',
                  background: 'rgba(15, 23, 42, 0.42)',
                }}
              >
                <div>
                  <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                    <TrendingUp size={14} />
                    Forecast
                  </p>
                  <p className="mt-2 font-semibold" style={{ color: forecastRiskColor }}>
                    {formatCurrency(budget.projected_spending)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{getForecastCopy(budget.forecast_status)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Days remaining</p>
                  <p className="mt-2 font-semibold text-white">{budget.days_remaining ?? 0}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {budget.days_elapsed ?? 0} days elapsed
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="secondary-button flex-1 gap-2 px-3 py-2 text-sm"
                  onClick={() => onEdit(budget)}
                >
                  <PencilLine size={15} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="secondary-button flex-1 gap-2 px-3 py-2 text-sm"
                  onClick={() => handleDelete(budget)}
                  disabled={isDeleting}
                  style={{
                    borderColor: 'rgba(244, 63, 94, 0.22)',
                    color: '#fecdd3',
                  }}
                >
                  <Trash2 size={15} />
                  <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default BudgetCategoryCards
