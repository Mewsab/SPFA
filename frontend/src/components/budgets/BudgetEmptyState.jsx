import { WalletCards } from 'lucide-react'

function BudgetEmptyState() {
  return (
    <div
      className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border px-6 py-10 text-center"
      style={{
        borderColor: 'rgba(103, 232, 249, 0.16)',
        background: 'rgba(255, 255, 255, 0.02)',
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-cyan-200"
        style={{
          border: '1px solid rgba(103, 232, 249, 0.2)',
          background: 'rgba(103, 232, 249, 0.08)',
        }}
      >
        <WalletCards size={22} />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-white">No budgets created yet.</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
        Create your first category budget to start tracking your spending limits.
      </p>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
        Use budgets to compare your spending against category limits.
      </p>
    </div>
  )
}

export default BudgetEmptyState
