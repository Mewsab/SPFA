const statusStyles = {
  within_limit: {
    label: 'Within Limit',
    color: '#22c55e',
    background: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.25)',
  },
  near_limit: {
    label: 'Near Limit',
    color: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  exceeded: {
    label: 'Exceeded',
    color: '#f43f5e',
    background: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.25)',
  },
  safe: {
    label: 'Safe',
    color: '#22c55e',
    background: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.25)',
  },
  watch: {
    label: 'Watch',
    color: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  risk: {
    label: 'Risk',
    color: '#f43f5e',
    background: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.25)',
  },
}

function BudgetStatusBadge({ status }) {
  const style = statusStyles[status] || {
    label: 'Unknown',
    color: '#94a3b8',
    background: 'rgba(148, 163, 184, 0.10)',
    border: 'rgba(148, 163, 184, 0.20)',
  }

  return (
    <span
      className="inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold"
      style={{
        borderColor: style.border,
        background: style.background,
        color: style.color,
      }}
    >
      {style.label}
    </span>
  )
}

export default BudgetStatusBadge
