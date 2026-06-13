import { useMemo, useState } from 'react'

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

function buildInitialFormState(transaction, transactionCategories) {
  const validCategoryValues = new Set(transactionCategories.map((category) => category.value))
  const resolvedCategory = transaction?.category && validCategoryValues.has(transaction.category)
    ? transaction.category
    : transaction
      ? 'other'
      : ''

  if (!transaction) {
    return {
      amount: '',
      category: '',
      transaction_date: getTodayDate(),
      description: '',
      transaction_type: '',
    }
  }

  return {
    amount: transaction.amount ?? '',
    category: resolvedCategory,
    transaction_date: transaction.transaction_date ?? getTodayDate(),
    description: transaction.description ?? '',
    transaction_type: transaction.transaction_type ?? '',
  }
}

function TransactionForm({
  transactionCategories,
  transactionTypes,
  initialTransaction,
  onSubmit,
  onCancelEdit,
  isSubmitting = false,
  serverMessage = '',
}) {
  const isEditMode = Boolean(initialTransaction)
  const [formData, setFormData] = useState(
    buildInitialFormState(initialTransaction, transactionCategories),
  )
  const [errors, setErrors] = useState({})

  const submitLabel = useMemo(() => {
    if (isSubmitting && isEditMode) {
      return 'Saving changes...'
    }

    if (isSubmitting) {
      return 'Saving transaction...'
    }

    return isEditMode ? 'Save changes' : 'Add transaction'
  }, [isEditMode, isSubmitting])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    const amountValue = Number(formData.amount)

    if (!formData.amount || Number.isNaN(amountValue) || amountValue <= 0) {
      nextErrors.amount = 'Enter an amount greater than 0.'
    }

    if (!formData.category.trim()) {
      nextErrors.category = 'Category is required.'
    }

    if (!formData.transaction_date) {
      nextErrors.transaction_date = 'Transaction date is required.'
    }

    if (!formData.transaction_type) {
      nextErrors.transaction_type = 'Transaction type is required.'
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
      amount: String(formData.amount).trim(),
      category: formData.category,
      transaction_date: formData.transaction_date,
      description: formData.description.trim(),
      transaction_type: formData.transaction_type,
    })

    if (wasSuccessful && !isEditMode) {
      setFormData(buildInitialFormState(null, transactionCategories))
      setErrors({})
    }
  }

  return (
    <section className="soft-panel p-5 sm:p-6">
      <div>
        <h3 className="text-lg font-semibold text-white">
          {isEditMode ? 'Edit transaction' : 'Add transaction'}
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          Record income and expenses with the details you want to keep on hand.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {serverMessage ? (
          <div
            className="rounded-xl border px-4 py-3 text-sm text-slate-200"
            style={{
              borderColor: 'var(--spfa-border-accent)',
              background: 'rgba(15, 17, 23, 0.78)',
            }}
          >
            {serverMessage}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="font-medium text-slate-200">Amount</span>
            <input
              className="form-input"
              name="amount"
              type="number"
              min="0.001"
              step="0.001"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.000"
            />
            {errors.amount ? <p className="text-sm text-rose-300">{errors.amount}</p> : null}
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="font-medium text-slate-200">Category</span>
            <select
              className="form-input"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">Select category</option>
              {transactionCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category ? <p className="text-sm text-rose-300">{errors.category}</p> : null}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="font-medium text-slate-200">Transaction Date</span>
            <input
              className="form-input"
              name="transaction_date"
              type="date"
              value={formData.transaction_date}
              onChange={handleChange}
            />
            {errors.transaction_date ? (
              <p className="text-sm text-rose-300">{errors.transaction_date}</p>
            ) : null}
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="font-medium text-slate-200">Transaction Type</span>
            <select
              className="form-input"
              name="transaction_type"
              value={formData.transaction_type}
              onChange={handleChange}
            >
              <option value="">Select type</option>
              {transactionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.transaction_type ? (
              <p className="text-sm text-rose-300">{errors.transaction_type}</p>
            ) : null}
          </label>
        </div>

        <label className="space-y-2 text-sm text-slate-300">
          <span className="font-medium text-slate-200">Description</span>
          <textarea
            className="form-input min-h-[120px] resize-y"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional note about this transaction"
          />
        </label>

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

export default TransactionForm
