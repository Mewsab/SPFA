function BudgetFilters({
  filters,
  budgetCategories,
  periodTypes,
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
            Narrow budgets by category, period, or current status.
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

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm text-slate-300">
          <span className="font-medium text-slate-200">Category</span>
          <select
            className="form-input"
            name="category"
            value={filters.category}
            onChange={handleChange}
          >
            <option value="">All Categories</option>
            {budgetCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          <span className="font-medium text-slate-200">Period</span>
          <select
            className="form-input"
            name="period_type"
            value={filters.period_type}
            onChange={handleChange}
          >
            <option value="">All Periods</option>
            {periodTypes.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          <span className="font-medium text-slate-200">Status</span>
          <select
            className="form-input"
            name="status"
            value={filters.status}
            onChange={handleChange}
          >
            <option value="">All Statuses</option>
            <option value="within_limit">Within Limit</option>
            <option value="near_limit">Near Limit</option>
            <option value="exceeded">Exceeded</option>
          </select>
        </label>
      </div>
    </section>
  )
}

export default BudgetFilters
