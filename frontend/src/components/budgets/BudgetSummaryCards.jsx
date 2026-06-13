const amountFormatter = new Intl.NumberFormat('en-OM', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatCurrency(amount) {
  return `OMR ${amountFormatter.format(Number(amount || 0))}`
}

function getAlertAccent(summary) {
  if (Number(summary?.alert_count || 0) > 0) {
    return '#f43f5e'
  }

  return '#67e8f9'
}

function SummaryCard({ label, value, description, accent }) {
  return (
    <article
      className="rounded-2xl border p-5"
      style={{
        borderColor: 'rgba(103, 232, 249, 0.22)',
        background: 'rgba(255, 255, 255, 0.03)',
        boxShadow: '0 18px 40px rgba(2, 6, 23, 0.22)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
        </div>
        <span
          className="mt-1 h-3 w-3 rounded-full"
          style={{ background: accent, boxShadow: `0 0 20px ${accent}66` }}
        />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  )
}

function BudgetSummaryCards({ overview, isLoading = false }) {
  const alerts = Number(overview?.alert_count || 0)
  const alertDescription = `${overview?.exceeded_count || 0} exceeded, ${overview?.near_limit_count || 0} near limit.`
  const remainingAccent = Number(overview?.total_remaining || 0) < 0 ? '#f43f5e' : '#22c55e'
  const projectedAccent = Number(overview?.projected_remaining || 0) < 0 ? '#f43f5e' : '#f59e0b'

  const cardData = [
    {
      label: 'Total Budget',
      value: isLoading ? 'Loading...' : formatCurrency(overview?.total_budget_limit),
      description: 'Limits currently assigned across your budget categories.',
      accent: '#67e8f9',
    },
    {
      label: 'Spent',
      value: isLoading ? 'Loading...' : formatCurrency(overview?.total_spent),
      description: 'Expense activity counted inside active budget ranges.',
      accent: '#f59e0b',
    },
    {
      label: 'Remaining',
      value: isLoading ? 'Loading...' : formatCurrency(overview?.total_remaining),
      description: 'Budget room left after tracked category spending.',
      accent: remainingAccent,
    },
    {
      label: 'Projected Spending',
      value: isLoading ? 'Loading...' : formatCurrency(overview?.total_projected_spending),
      description: 'Forecast based on current spending pace.',
      accent: projectedAccent,
    },
    {
      label: 'Alerts',
      value: isLoading ? 'Loading...' : String(alerts),
      description: isLoading ? 'Checking budget health...' : alertDescription,
      accent: getAlertAccent(overview),
    },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cardData.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </section>
  )
}

export default BudgetSummaryCards
