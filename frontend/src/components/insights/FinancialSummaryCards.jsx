import { ArrowDownRight, ArrowUpRight, Percent, Scale } from 'lucide-react'

function formatCurrency(value) {
  return `OMR ${Number(value || 0).toFixed(2)}`
}

function formatPercentage(value) {
  return `${Number(value || 0).toFixed(2)}%`
}

function MetricBlock({ label, value, description, color, icon: Icon }) {
  return (
    <article
      className="rounded-lg border-l-2 px-4 py-3"
      style={{
        borderColor: 'var(--spfa-border)',
        borderLeftColor: color,
        background: 'rgba(255, 255, 255, 0.025)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            border: `1px solid ${color}55`,
            background: `${color}14`,
            color,
          }}
        >
          <Icon size={15} />
        </div>
        <p className="text-sm font-semibold uppercase text-slate-400">{label}</p>
      </div>
      <p className="mt-3 break-words text-xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm leading-5 text-slate-400">{description}</p>
    </article>
  )
}

function FinancialSummaryCards({ summary, isLoading }) {
  const balance = Number(summary?.balance || 0)

  const cards = [
    {
      label: 'Total Income',
      value: formatCurrency(summary?.total_income),
      description: `${Number(summary?.income_transaction_count || 0)} income transactions.`,
      color: '#22c55e',
      icon: ArrowUpRight,
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(summary?.total_expense),
      description: `${Number(summary?.expense_transaction_count || 0)} expense transactions.`,
      color: '#f59e0b',
      icon: ArrowDownRight,
    },
    {
      label: 'Balance',
      value: formatCurrency(summary?.balance),
      description: `${Number(summary?.transaction_count || 0).toLocaleString()} total transactions.`,
      color: balance >= 0 ? '#38bdf8' : '#f43f5e',
      icon: Scale,
    },
    {
      label: 'Savings Rate',
      value: formatPercentage(summary?.savings_rate_percentage),
      description: `${formatPercentage(summary?.expense_ratio_percentage)} expense ratio.`,
      color: '#22c55e',
      icon: Percent,
    },
  ]

  if (isLoading) {
    return (
      <aside className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {cards.map((card) => (
          <MetricBlock
            key={card.label}
            {...card}
            value="Loading..."
            description="Preparing financial summary."
          />
        ))}
      </aside>
    )
  }

  return (
    <aside className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
      {cards.map((card) => (
        <MetricBlock key={card.label} {...card} />
      ))}
    </aside>
  )
}

export default FinancialSummaryCards
