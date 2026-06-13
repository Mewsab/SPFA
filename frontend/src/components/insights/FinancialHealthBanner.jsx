import { Activity, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

const statusStyles = {
  healthy: {
    label: 'Healthy',
    icon: CheckCircle2,
    color: '#22c55e',
    border: 'rgba(34, 197, 94, 0.28)',
    background: 'rgba(34, 197, 94, 0.08)',
  },
  watch: {
    label: 'Watch',
    icon: Activity,
    color: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.3)',
    background: 'rgba(245, 158, 11, 0.08)',
  },
  risk: {
    label: 'Risk',
    icon: AlertTriangle,
    color: '#f43f5e',
    border: 'rgba(244, 63, 94, 0.3)',
    background: 'rgba(244, 63, 94, 0.08)',
  },
  no_data: {
    label: 'No data',
    icon: Info,
    color: '#67e8f9',
    border: 'rgba(103, 232, 249, 0.28)',
    background: 'rgba(103, 232, 249, 0.1)',
  },
}

function formatPercentage(value) {
  return `${Number(value || 0).toFixed(2)}%`
}

function FinancialHealthBanner({ summary }) {
  const status = summary?.financial_health_status || 'no_data'
  const style = statusStyles[status] || statusStyles.no_data
  const Icon = style.icon

  return (
    <section
      className="soft-panel h-full px-4 py-4 sm:px-5"
      style={{ borderColor: style.border }}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ border: `1px solid ${style.border}`, background: style.background, color: style.color }}
          >
            <Icon size={19} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold text-white">Financial Health</h3>
              <span
                className="rounded-full border px-3 py-1 text-xs font-semibold uppercase"
                style={{ borderColor: style.border, background: style.background, color: style.color }}
              >
                {style.label}
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              {summary?.financial_health_message ||
                'Add transactions or upload a CSV statement to generate insights.'}
            </p>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3">
          <div
            className="rounded-lg border px-4 py-3"
            style={{ borderColor: 'var(--spfa-border)', background: 'rgba(255, 255, 255, 0.03)' }}
          >
            <p className="text-sm font-medium uppercase text-slate-400">Savings Rate</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {formatPercentage(summary?.savings_rate_percentage)}
            </p>
          </div>
          <div
            className="rounded-lg border px-4 py-3"
            style={{ borderColor: 'var(--spfa-border)', background: 'rgba(255, 255, 255, 0.03)' }}
          >
            <p className="text-sm font-medium uppercase text-slate-400">Expense Ratio</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {formatPercentage(summary?.expense_ratio_percentage)}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FinancialHealthBanner
