import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react'

const bannerStyles = {
  healthy: {
    icon: CheckCircle2,
    accent: '#22c55e',
    title: 'Budget health looks good',
    message: 'Your budgets are currently in a healthy range.',
  },
  watch: {
    icon: AlertTriangle,
    accent: '#f59e0b',
    title: 'Budget watch',
    message: 'Some budgets are approaching their limits.',
  },
  risk: {
    icon: ShieldAlert,
    accent: '#f43f5e',
    title: 'Budget risk detected',
    message: 'One or more budgets may exceed their limits.',
  },
  empty: {
    icon: Info,
    accent: '#67e8f9',
    title: 'Ready for budget alerts',
    message: 'Create your first budget to start receiving spending alerts.',
  },
}

function findRiskiestBudget(overview) {
  const budgets = overview?.budgets || []
  const highestRiskCategory = overview?.highest_risk_category

  return (
    budgets.find((budget) => budget.category === highestRiskCategory)
    || budgets.find((budget) => budget.alert_level === 'danger')
    || budgets.find((budget) => budget.alert_level === 'warning')
    || null
  )
}

function BudgetAlertBanner({ overview }) {
  const hasBudgets = (overview?.budgets || []).length > 0
  const status = hasBudgets ? overview?.overall_budget_status || 'healthy' : 'empty'
  const style = bannerStyles[status] || bannerStyles.healthy
  const Icon = style.icon
  const riskiestBudget = findRiskiestBudget(overview)
  const message = status === 'risk'
    ? riskiestBudget?.alert_message || style.message
    : style.message

  return (
    <section
      className="rounded-2xl border p-5 sm:p-6"
      style={{
        borderColor: `${style.accent}55`,
        background: 'rgba(255, 255, 255, 0.03)',
        boxShadow: '0 22px 55px rgba(2, 6, 23, 0.26)',
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
            style={{
              borderColor: `${style.accent}55`,
              background: `${style.accent}18`,
              color: style.accent,
            }}
          >
            <Icon size={22} />
          </div>
          <div>
            <p className="text-base font-semibold text-white">{style.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">{message}</p>
          </div>
        </div>

        <div
          className="w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
          style={{
            borderColor: `${style.accent}55`,
            background: `${style.accent}12`,
            color: style.accent,
          }}
        >
          {hasBudgets ? `${overview?.alert_count || 0} alerts` : 'No budgets yet'}
        </div>
      </div>
    </section>
  )
}

export default BudgetAlertBanner
