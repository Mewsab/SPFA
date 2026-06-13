const progressColors = {
  within_limit: '#22c55e',
  near_limit: '#f59e0b',
  exceeded: '#f43f5e',
}

function formatPercentage(value) {
  const numericValue = Number(value || 0)
  return `${numericValue.toFixed(numericValue % 1 === 0 ? 0 : 1)}%`
}

function BudgetProgressBar({ value, status, label = 'Usage' }) {
  const numericValue = Number(value || 0)
  const width = Math.min(Math.max(numericValue, 0), 100)
  const color = progressColors[status] || '#67e8f9'

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold text-white">{formatPercentage(numericValue)}</span>
      </div>
      <div
        className="mt-2 h-2.5 overflow-hidden rounded-full border"
        style={{
          borderColor: 'rgba(148, 163, 184, 0.12)',
          background: 'rgba(148, 163, 184, 0.14)',
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${width}%`,
            background: color,
            boxShadow: `0 0 18px ${color}55`,
          }}
        />
      </div>
    </div>
  )
}

export default BudgetProgressBar
