import { PencilLine, Trash2 } from 'lucide-react'
import TransactionEmptyState from './TransactionEmptyState'

const amountFormatter = new Intl.NumberFormat('en-OM', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

function formatCurrency(amount, transactionType) {
  const prefix = transactionType === 'expense' ? '-' : '+'
  return `${prefix} OMR ${amountFormatter.format(Number(amount || 0))}`
}

function formatType(transactionType) {
  return transactionType === 'income' ? 'Income' : 'Expense'
}

function formatCategory(categoryValue, transactionCategories) {
  return (
    transactionCategories.find((category) => category.value === categoryValue)?.label
    || categoryValue
  )
}

function TransactionTable({
  transactionCategories,
  transactions,
  isLoading = false,
  activeDeleteId = null,
  onEdit,
  onDelete,
}) {
  const handleDelete = (transaction) => {
    const categoryLabel = formatCategory(transaction.category, transactionCategories)
    const confirmed = window.confirm(
      `Delete the ${categoryLabel} transaction from ${transaction.transaction_date}?`,
    )

    if (confirmed) {
      onDelete(transaction)
    }
  }

  if (isLoading) {
    return (
      <section className="soft-panel p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-white">Transactions</h3>
        <p className="mt-5 text-sm text-slate-400">Loading transactions...</p>
      </section>
    )
  }

  if (transactions.length === 0) {
    return <TransactionEmptyState />
  }

  return (
    <section className="soft-panel overflow-hidden">
      <div className="border-b px-5 py-5 sm:px-6" style={{ borderColor: 'var(--spfa-border)' }}>
        <h3 className="text-lg font-semibold text-white">Transactions</h3>
        <p className="mt-1 text-sm text-slate-400">
          Review, edit, and remove entries from your transaction history.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-400" style={{ borderColor: 'var(--spfa-border)' }}>
              <th className="px-5 py-4 font-medium sm:px-6">Date</th>
              <th className="px-5 py-4 font-medium sm:px-6">Category</th>
              <th className="px-5 py-4 font-medium sm:px-6">Type</th>
              <th className="px-5 py-4 font-medium sm:px-6">Amount</th>
              <th className="px-5 py-4 font-medium sm:px-6">Description</th>
              <th className="px-5 py-4 font-medium sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => {
              const isExpense = transaction.transaction_type === 'expense'
              const isDeleting = activeDeleteId === transaction.transaction_id

              return (
                <tr
                  key={transaction.transaction_id}
                  className="border-b align-top text-sm text-slate-200"
                  style={{ borderColor: 'var(--spfa-border)' }}
                >
                  <td className="whitespace-nowrap px-5 py-4 sm:px-6">{transaction.transaction_date}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-white sm:px-6">
                    {formatCategory(transaction.category, transactionCategories)}
                  </td>
                  <td className="px-5 py-4 sm:px-6">
                    <span
                      className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                      style={{
                        borderColor: isExpense
                          ? 'rgba(244, 63, 94, 0.28)'
                          : 'rgba(34, 197, 94, 0.28)',
                        background: isExpense
                          ? 'rgba(244, 63, 94, 0.08)'
                          : 'rgba(34, 197, 94, 0.08)',
                        color: isExpense ? '#fb7185' : '#86efac',
                      }}
                    >
                      {formatType(transaction.transaction_type)}
                    </span>
                  </td>
                  <td
                    className="whitespace-nowrap px-5 py-4 font-semibold sm:px-6"
                    style={{ color: isExpense ? '#f43f5e' : '#22c55e' }}
                  >
                    {formatCurrency(transaction.amount, transaction.transaction_type)}
                  </td>
                  <td className="max-w-xs px-5 py-4 text-slate-300 sm:px-6">
                    {transaction.description || 'No description'}
                  </td>
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="secondary-button gap-2 px-3 py-2 text-sm"
                        onClick={() => onEdit(transaction)}
                      >
                        <PencilLine size={15} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="secondary-button gap-2 px-3 py-2 text-sm"
                        onClick={() => handleDelete(transaction)}
                        disabled={isDeleting}
                        style={{
                          borderColor: 'rgba(148, 163, 184, 0.22)',
                          color: '#f8fafc',
                        }}
                      >
                        <Trash2 size={15} />
                        <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default TransactionTable
