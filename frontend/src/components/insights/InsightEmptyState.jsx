import { FileUp } from 'lucide-react'

function InsightEmptyState() {
  return (
    <div
      className="rounded-lg border px-5 py-6 text-sm leading-7 text-slate-300"
      style={{
        borderColor: 'var(--spfa-border)',
        background: 'rgba(255, 255, 255, 0.03)',
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg text-cyan-200"
          style={{
            border: '1px solid var(--spfa-border-accent)',
            background: 'var(--spfa-accent)',
          }}
        >
          <FileUp size={18} />
        </div>
        <p>Upload a CSV statement or add transactions to generate AI-ready budgeting insights.</p>
      </div>
    </div>
  )
}

export default InsightEmptyState
