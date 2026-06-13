import StatCard from '../ui/StatCard'

const amountFormatter = new Intl.NumberFormat('en-OM', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

function formatCurrency(amount) {
  const numericAmount = Number(amount || 0)
  return `OMR ${amountFormatter.format(numericAmount)}`
}

function TransactionSummaryCards({ summary, isLoading = false }) {
  const cardData = [
    {
      label: 'Total Income',
      labelColor: '#22c55e',
      value: isLoading ? 'Loading...' : formatCurrency(summary?.total_income),
      description: 'Income recorded across your account.',
    },
    {
      label: 'Total Expense',
      labelColor: '#f43f5e',
      value: isLoading ? 'Loading...' : formatCurrency(summary?.total_expense),
      description: 'Expenses recorded across your account.',
    },
    {
      label: 'Balance',
      labelColor: '#f59e0b',
      value: isLoading ? 'Loading...' : formatCurrency(summary?.balance),
      description: 'Net balance from income minus expenses.',
    },
    {
      label: 'Transactions',
      labelColor: '#67e8f9',
      value: isLoading ? 'Loading...' : String(summary?.transaction_count ?? 0),
      description: 'Total recorded transaction entries.',
    },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cardData.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </section>
  )
}

export default TransactionSummaryCards
