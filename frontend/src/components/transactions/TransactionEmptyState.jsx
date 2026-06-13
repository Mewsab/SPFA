import { ReceiptText } from 'lucide-react'

function TransactionEmptyState() {
  return (
    <div
      className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border px-6 py-10 text-center"
      style={{
        borderColor: 'var(--spfa-border)',
        background: 'rgba(255, 255, 255, 0.03)',
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-cyan-200"
        style={{
          border: '1px solid var(--spfa-border-accent)',
          background: 'var(--spfa-accent)',
        }}
      >
        <ReceiptText size={22} />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-white">No transactions yet.</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
        Add your first income or expense to start tracking your financial activity.
      </p>
    </div>
  )
}

export default TransactionEmptyState
