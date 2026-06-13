import { CheckCircle2, ListChecks, Sparkles } from 'lucide-react'

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
}

const impactStyles = {
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
    color: '#67e8f9',
    border: 'rgba(103, 232, 249, 0.24)',
    background: 'rgba(103, 232, 249, 0.07)',
  },
}

function formatLabel(value) {
  if (!value) {
    return ''
  }

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function AIAdviceCard({ advice }) {
  if (!advice) {
    return null
  }

  const priority = priorityStyles[advice.priority_level] || priorityStyles.watch
  const tips = (advice.tips || []).slice(0, 3)
  const nextSteps = (advice.next_steps || []).slice(0, 2)

  return (
    <div className="mt-4 space-y-4">
      <div
        className="rounded-lg border p-3.5"
        style={{ borderColor: 'var(--spfa-border-accent)', background: 'rgba(103, 232, 249, 0.08)' }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase text-cyan-100">
              <Sparkles size={14} />
              <span>Personalized advice</span>
            </div>
            <h4 className="mt-2 text-lg font-semibold text-white">{advice.headline}</h4>
            <p className="mt-1.5 text-sm leading-6 text-slate-300">{advice.overall_assessment}</p>
          </div>

          <span
            className="w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase"
            style={{ borderColor: priority.border, background: priority.background, color: priority.color }}
          >
            {priority.label}
          </span>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold uppercase text-slate-400">Recommended focus</h4>
        <div className="mt-3 grid gap-2.5 lg:grid-cols-3">
          {tips.map((tip, index) => {
            const impact = impactStyles[tip.impact] || impactStyles.medium

            return (
              <article
                key={`${tip.title}-${index}`}
                className="rounded-lg border p-3"
                style={{ borderColor: 'var(--spfa-border)', background: 'rgba(255, 255, 255, 0.03)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <h5 className="text-sm font-semibold leading-5 text-white">{tip.title}</h5>
                  <span
                    className="w-fit shrink-0 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase"
                    style={{ borderColor: impact.border, background: impact.background, color: impact.color }}
                  >
                    {tip.impact} impact
                  </span>
                </div>
                <p className="mt-2 text-sm leading-5 text-slate-300">{tip.description}</p>
                {tip.category ? (
                  <p className="mt-2 text-[0.68rem] font-medium uppercase text-slate-500">
                    Category: <span className="text-slate-300">{formatLabel(tip.category)}</span>
                  </p>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>

      <div
        className="rounded-lg border p-3.5"
        style={{ borderColor: 'var(--spfa-border)', background: 'rgba(255, 255, 255, 0.03)' }}
      >
        <div className="flex items-center gap-2">
          <ListChecks size={15} className="text-cyan-200" />
          <h4 className="text-sm font-semibold text-white">Next steps</h4>
        </div>
        <ul className="mt-2 grid gap-2 md:grid-cols-2">
          {nextSteps.map((step, index) => (
            <li key={`${step}-${index}`} className="flex gap-2 text-sm leading-5 text-slate-300">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-300" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="border-t pt-4 text-xs leading-5 text-slate-500" style={{ borderColor: 'var(--spfa-border)' }}>
        {advice.disclaimer}
      </p>
    </div>
  )
}

export default AIAdviceCard
