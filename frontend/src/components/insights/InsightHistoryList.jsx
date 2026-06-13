const priorityStyles = {
  healthy: {
    label: 'Healthy',
    color: '#22c55e',
    border: 'rgba(34, 197, 94, 0.28)',
    background: 'rgba(34, 197, 94, 0.08)',
  },
  watch: {
    label: 'Watch',
    color: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.3)',
    background: 'rgba(245, 158, 11, 0.08)',
  },
  risk: {
    label: 'Risk',
    color: '#f43f5e',
    border: 'rgba(244, 63, 94, 0.3)',
    background: 'rgba(244, 63, 94, 0.08)',
  },
  default: {
    label: 'Insight',
    color: '#67e8f9',
    border: 'rgba(103, 232, 249, 0.24)',
    background: 'rgba(103, 232, 249, 0.07)',
  },
}

function formatDate(value) {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function formatPriority(value) {
  if (!value) {
    return priorityStyles.default
  }

  const style = priorityStyles[value] || priorityStyles.default

  return {
    ...style,
    label: style.label || value,
  }
}

function InsightHistoryList({ history = [], errorMessage = '' }) {
  return (
    <section className="soft-panel px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-1 border-b pb-4" style={{ borderColor: 'var(--spfa-border)' }}>
        <h3 className="text-lg font-semibold text-white">Previous Budgeting Insights</h3>
        {errorMessage ? <p className="text-sm text-rose-200">{errorMessage}</p> : null}
      </div>

      {history.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-slate-400">
          Previous AI budgeting insights will appear here after you generate advice.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr className="border-b" style={{ borderColor: 'var(--spfa-border)' }}>
                <th className="whitespace-nowrap px-3 py-2 font-semibold">Date</th>
                <th className="px-3 py-2 font-semibold">Headline</th>
                <th className="whitespace-nowrap px-3 py-2 font-semibold">Priority</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => {
                const priority = formatPriority(item.priority_level)

                return (
                  <tr
                    key={item.insight_id}
                    className="border-b align-top last:border-b-0"
                    style={{ borderColor: 'rgba(148, 163, 184, 0.12)' }}
                  >
                    <td className="whitespace-nowrap px-3 py-3 text-slate-400">{formatDate(item.created_at)}</td>
                    <td className="min-w-[260px] px-3 py-3">
                      <p className="font-medium text-white">{item.headline}</p>
                      <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-400">{item.summary_text}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span
                        className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase"
                        style={{
                          borderColor: priority.border,
                          background: priority.background,
                          color: priority.color,
                        }}
                      >
                        {priority.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default InsightHistoryList
