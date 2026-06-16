import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const statusStyles = {
  completed: {
    label: 'Completed',
    color: '#22c55e',
    border: 'rgba(34, 197, 94, 0.28)',
    background: 'rgba(34, 197, 94, 0.08)',
    icon: CheckCircle2,
  },
  completed_with_errors: {
    label: 'Completed with errors',
    color: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.3)',
    background: 'rgba(245, 158, 11, 0.08)',
    icon: AlertCircle,
  },
  failed: {
    label: 'Failed',
    color: '#f43f5e',
    border: 'rgba(244, 63, 94, 0.3)',
    background: 'rgba(244, 63, 94, 0.08)',
    icon: AlertCircle,
  },
}

function ImportResultCard({ result }) {
  const [showErrors, setShowErrors] = useState(false)

  if (!result) {
    return null
  }

  const batch = result.import_batch || {}
  const style = statusStyles[batch.status] || statusStyles.failed
  const Icon = style.icon
  const visibleErrors = result.errors?.slice(0, 5) || []

  const metrics = [
    { label: 'Total rows', value: batch.total_rows ?? 0 },
    { label: 'Successful rows', value: batch.successful_rows ?? 0 },
    { label: 'Failed rows', value: batch.failed_rows ?? 0 },
    { label: 'Imported transactions', value: result.imported_transactions_count ?? 0 },
    { label: 'Failed row count', value: result.failed_rows_count ?? 0 },
  ]

  return (
    <section className="soft-panel px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-white">Import Result</h3>
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase"
              style={{ borderColor: style.border, background: style.background, color: style.color }}
            >
              <Icon size={14} />
              {style.label}
            </span>
          </div>
          <p className="mt-2 break-all text-sm text-slate-400">{batch.file_name}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border px-4 py-3"
            style={{ borderColor: 'var(--spfa-border)', background: 'rgba(255, 255, 255, 0.03)' }}
          >
            <p className="text-xs font-medium uppercase text-slate-500">{metric.label}</p>
            <p className="mt-2 text-lg font-semibold text-white">{metric.value}</p>
          </div>
        ))}
      </div>

      {visibleErrors.length > 0 ? (
        <div className="mt-5">
          <button
            type="button"
            className="secondary-button gap-2 px-4 py-3"
            onClick={() => setShowErrors((current) => !current)}
          >
            {showErrors ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{showErrors ? 'Hide row errors' : 'Show row errors'}</span>
          </button>

          {showErrors ? (
            <div
              className="mt-4 rounded-lg border p-4"
              style={{ borderColor: 'rgba(245, 158, 11, 0.22)', background: 'rgba(245, 158, 11, 0.06)' }}
            >
              <p className="text-sm font-medium text-amber-100">Showing first 5 errors</p>
              <div className="mt-3 space-y-2">
                {visibleErrors.map((error) => (
                  <div key={`${error.row_number}-${error.reason}`} className="text-sm leading-6 text-slate-300">
                    <span className="font-semibold text-white">Row {error.row_number}:</span>{' '}
                    {error.reason}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default ImportResultCard
