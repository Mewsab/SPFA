import { useMemo, useState } from 'react'

function buildInitialFormState(budget, budgetCategories, periodTypes) {
  const validCategoryValues = new Set(budgetCategories.map((category) => category.value))
  const validPeriodValues = new Set(periodTypes.map((period) => period.value))

  if (!budget) {
    return {
      category: '',
      limit_amount: '',
      period_type: '',
      start_date: '',
      end_date: '',
    }
  }

  return {
    category: validCategoryValues.has(budget.category) ? budget.category : '',
    limit_amount: budget.limit_amount ?? '',
    period_type: validPeriodValues.has(budget.period_type) ? budget.period_type : '',
    start_date: budget.start_date ?? '',
    end_date: budget.end_date ?? '',
  }
}

function BudgetForm({
  budgetCategories,
  periodTypes,
  initialBudget,
  onSubmit,
  onCancelEdit,
  isSubmitting = false,
  serverMessage = '',
}) {
  const isEditMode = Boolean(initialBudget)
  const [formData, setFormData] = useState(
    buildInitialFormState(initialBudget, budgetCategories, periodTypes),
  )
  const [errors, setErrors] = useState({})

  const submitLabel = useMemo(() => {
    if (isSubmitting && isEditMode) {
      return 'Saving changes...'
    }

    if (isSubmitting) {
      return 'Creating budget...'
    }

    return isEditMode ? 'Save changes' : 'Create budget'
  }, [isEditMode, isSubmitting])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    const limitValue = Number(formData.limit_amount)

    if (!formData.category) {
      nextErrors.category = 'Category is required.'
    }

    if (!formData.limit_amount || Number.isNaN(limitValue) || limitValue <= 0) {
      nextErrors.limit_amount = 'Enter a budget limit greater than 0.'
    }

    if (!formData.period_type) {
      nextErrors.period_type = 'Period is required.'
    }

    if (!formData.start_date) {
      nextErrors.start_date = 'Start date is required.'
    }

    if (!formData.end_date) {
      nextErrors.end_date = 'End date is required.'
    }

    if (formData.start_date && formData.end_date) {
      if (formData.end_date < formData.start_date) {
        nextErrors.end_date = 'End date cannot be before start date.'
      } else if (
        ['weekly', 'monthly', 'yearly'].includes(formData.period_type)
        && formData.end_date === formData.start_date
      ) {
        nextErrors.end_date = 'Weekly, monthly, and yearly budgets must end after the start date.'
      }
    }

    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const wasSuccessful = await onSubmit({
      category: formData.category,
      limit_amount: String(formData.limit_amount).trim(),
      period_type: formData.period_type,
      start_date: formData.start_date,
      end_date: formData.end_date,
    })

    if (wasSuccessful && !isEditMode) {
      setFormData(buildInitialFormState(null, budgetCategories, periodTypes))
      setErrors({})
    }
  }

  return (
    <section className="soft-panel p-5 sm:p-6">
      <div>
        <h3 className="text-lg font-semibold text-white">
          {isEditMode ? 'Edit budget' : 'Create budget'}
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          Set a category limit and date range for spending comparisons.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {serverMessage ? (
          <div
            className="rounded-xl border px-4 py-3 text-sm text-slate-200"
            style={{
              borderColor: 'rgba(103, 232, 249, 0.24)',
              background: 'rgba(15, 23, 42, 0.78)',
            }}
          >
            {serverMessage}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="font-medium text-slate-200">Category</span>
            <select
              className="form-input"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">Select category</option>
              {budgetCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category ? <p className="text-xs text-rose-300">{errors.category}</p> : null}
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="font-medium text-slate-200">Limit Amount</span>
            <input
              className="form-input"
              name="limit_amount"
              type="number"
              min="0.01"
              step="0.01"
              value={formData.limit_amount}
              onChange={handleChange}
              placeholder="0.00"
            />
            {errors.limit_amount ? <p className="text-xs text-rose-300">{errors.limit_amount}</p> : null}
          </label>
        </div>

        <label className="space-y-2 text-sm text-slate-300">
          <span className="font-medium text-slate-200">Period</span>
          <select
            className="form-input"
            name="period_type"
            value={formData.period_type}
            onChange={handleChange}
          >
            <option value="">Select period</option>
            {periodTypes.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          {errors.period_type ? <p className="text-xs text-rose-300">{errors.period_type}</p> : null}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="font-medium text-slate-200">Start Date</span>
            <input
              className="form-input"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleChange}
            />
            {errors.start_date ? <p className="text-xs text-rose-300">{errors.start_date}</p> : null}
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="font-medium text-slate-200">End Date</span>
            <input
              className="form-input"
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={handleChange}
            />
            {errors.end_date ? <p className="text-xs text-rose-300">{errors.end_date}</p> : null}
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="primary-button flex-1" type="submit" disabled={isSubmitting}>
            {submitLabel}
          </button>

          {isEditMode ? (
            <button
              type="button"
              className="secondary-button flex-1"
              onClick={onCancelEdit}
              disabled={isSubmitting}
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>
    </section>
  )
}

export default BudgetForm
