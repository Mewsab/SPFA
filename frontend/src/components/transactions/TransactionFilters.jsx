function TransactionFilters({
  filters,
  transactionCategories,
  transactionTypes,
  onChange,
  onClear,
}) {
  const handleChange = (event) => {
    const { name, value } = event.target
    onChange(name, value)
  }

  return (
    <section className="soft-panel p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          <p className="mt-1 text-sm text-slate-400">
            Narrow down the transaction list by type, category, or date range.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button self-start px-4 py-3"
          onClick={onClear}
        >
          Clear filters
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2 text-sm text-slate-300">
          <span className="font-medium text-slate-200">Transaction Type</span>
          <select
            className="form-input"
            name="transaction_type"
            value={filters.transaction_type}
            onChange={handleChange}
          >
            <option value="">All</option>
            {transactionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          <span className="font-medium text-slate-200">Category</span>
          <select
            className="form-input"
            name="category"
            value={filters.category}
            onChange={handleChange}
          >
            <option value="">All Categories</option>
            {transactionCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          <span className="font-medium text-slate-200">From</span>
          <input
            className="form-input"
            name="date_from"
            type="date"
            value={filters.date_from}
            onChange={handleChange}
          />
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          <span className="font-medium text-slate-200">To</span>
          <input
            className="form-input"
            name="date_to"
            type="date"
            value={filters.date_to}
            onChange={handleChange}
          />
        </label>
      </div>
    </section>
  )
}

export default TransactionFilters
