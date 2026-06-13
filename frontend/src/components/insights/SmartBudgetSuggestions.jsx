import { Lightbulb } from 'lucide-react'

const riskStyles = {
  high: {
    color: '#f43f5e',
    border: 'rgba(244, 63, 94, 0.28)',
    background: 'rgba(244, 63, 94, 0.08)',
  },
  medium: {
    color: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.3)',
    background: 'rgba(245, 158, 11, 0.08)',
  },
  low: {
    color: '#22c55e',
    border: 'rgba(34, 197, 94, 0.28)',
    background: 'rgba(34, 197, 94, 0.08)',
  },
}

function formatCurrency(value) {
  return `OMR ${Number(value || 0).toFixed(2)}`
}

function getShortReason(reason) {
  if (!reason) {
    return ''
  }

  const firstSentence = reason.split('. ')[0].trim()

  if (
    !firstSentence ||
    firstSentence.length > 84 ||
    firstSentence.toLowerCase().includes('potential savings')
  ) {
    return ''
  }

  return firstSentence.endsWith('.') ? firstSentence : `${firstSentence}.`
}

function SmartBudgetSuggestions({ suggestions = [] }) {
  return (
    <section className="soft-panel px-4 py-4 sm:px-5">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-cyan-200"
          style={{
            border: '1px solid var(--spfa-border-accent)',
            background: 'var(--spfa-accent)',
          }}
        >
          <Lightbulb size={18} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Smart Budget Suggestions</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Number-focused recommendations by spending category.
          </p>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div
          className="mt-5 rounded-lg border px-5 py-8 text-sm leading-7 text-slate-300"
          style={{ borderColor: 'var(--spfa-border)', background: 'rgba(255, 255, 255, 0.03)' }}
        >
          Smart budget suggestions will appear after spending data is available.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          {suggestions.map((suggestion) => {
            const risk = riskStyles[suggestion.risk_level] || riskStyles.low
            const shortReason = getShortReason(suggestion.reason)

            return (
              <article
                key={suggestion.category}
                className="rounded-lg border p-3.5"
                style={{
                  borderColor: 'var(--spfa-border)',
                  background: 'linear-gradient(145deg, rgba(8, 145, 178, 0.16), rgba(56, 189, 248, 0.06))',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold text-white">{suggestion.label}</h4>
                  </div>
                  <span
                    className="w-fit shrink-0 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase"
                    style={{ borderColor: risk.border, background: risk.background, color: risk.color }}
                  >
                    {suggestion.risk_level} risk
                  </span>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-400">Current</p>
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(suggestion.current_spending)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-400">Suggested</p>
                    <p className="text-sm font-semibold text-cyan-100">
                      {formatCurrency(suggestion.suggested_budget)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-400">Save</p>
                    <p className="text-sm font-semibold text-emerald-300">
                      {formatCurrency(suggestion.potential_savings)}
                    </p>
                  </div>
                </div>

                {shortReason ? (
                  <p className="mt-3 border-t pt-3 text-sm leading-5 text-slate-300" style={{ borderColor: 'var(--spfa-border)' }}>
                    {shortReason}
                  </p>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default SmartBudgetSuggestions
