import { useCallback, useEffect, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import TransactionFilters from '../components/transactions/TransactionFilters'
import TransactionForm from '../components/transactions/TransactionForm'
import TransactionSummaryCards from '../components/transactions/TransactionSummaryCards'
import TransactionTable from '../components/transactions/TransactionTable'
import {
  createTransaction,
  deleteTransaction,
  getTransactionCategories,
  getTransactionSummary,
  getTransactions,
  getTransactionTypes,
  updateTransaction,
} from '../api/transactionApi'
import { removeToken } from '../utils/authStorage'
import { useNavigate } from 'react-router-dom'

const DEFAULT_TRANSACTION_TYPES = [
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
]
const DEFAULT_TRANSACTION_CATEGORIES = [
  { label: 'Food', value: 'food' },
  { label: 'Transport', value: 'transport' },
  { label: 'Utilities', value: 'utilities' },
  { label: 'Salary', value: 'salary' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Education', value: 'education' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Savings', value: 'savings' },
  { label: 'Other', value: 'other' },
]

const INITIAL_FILTERS = {
  transaction_type: '',
  category: '',
  date_from: '',
  date_to: '',
}

function getApiErrorMessage(error, fallbackMessage) {
  const detail = error.response?.data?.detail

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(' ')
  }

  return fallbackMessage
}

function Transactions() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
    transaction_count: 0,
  })
  const [transactionCategories, setTransactionCategories] = useState(DEFAULT_TRANSACTION_CATEGORIES)
  const [transactionTypes, setTransactionTypes] = useState(DEFAULT_TRANSACTION_TYPES)
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [isLoadingSummary, setIsLoadingSummary] = useState(true)
  const [isSavingTransaction, setIsSavingTransaction] = useState(false)
  const [activeDeleteId, setActiveDeleteId] = useState(null)
  const [pageMessage, setPageMessage] = useState('')
  const [optionsMessage, setOptionsMessage] = useState('')
  const [formMessage, setFormMessage] = useState('')

  const handleUnauthorized = useCallback(() => {
    removeToken()
    navigate('/login', {
      replace: true,
      state: { message: 'Your session expired. Please log in again.' },
    })
  }, [navigate])

  const loadSummary = useCallback(async () => {
    try {
      const response = await getTransactionSummary()
      setSummary(response.data)
      setPageMessage('')
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized()
        return false
      }

      setPageMessage('Could not load transaction summary.')
      setSummary({
        total_income: 0,
        total_expense: 0,
        balance: 0,
        transaction_count: 0,
      })
    } finally {
      setIsLoadingSummary(false)
    }

    return true
  }, [handleUnauthorized])

  const loadTransactions = useCallback(
    async (activeFilters = filters) => {
      try {
        const response = await getTransactions(activeFilters)
        setTransactions(response.data)
        setPageMessage('')
      } catch (error) {
        if (error.response?.status === 401) {
          handleUnauthorized()
          return false
        }

        setTransactions([])
        setPageMessage('Could not load transactions.')
      } finally {
        setIsLoadingTransactions(false)
      }

      return true
    },
    [filters, handleUnauthorized],
  )

  useEffect(() => {
    let ignore = false

    const loadInitialSummary = async () => {
      try {
        const response = await getTransactionSummary()

        if (ignore) {
          return
        }

        setSummary(response.data)
        setPageMessage('')
      } catch (error) {
        if (ignore) {
          return
        }

        if (error.response?.status === 401) {
          handleUnauthorized()
          return
        }

        setSummary({
          total_income: 0,
          total_expense: 0,
          balance: 0,
          transaction_count: 0,
        })
        setPageMessage('Could not load transaction summary.')
      } finally {
        if (!ignore) {
          setIsLoadingSummary(false)
        }
      }
    }

    const loadInitialTypes = async () => {
      try {
        const response = await getTransactionTypes()

        if (ignore) {
          return
        }

        setTransactionTypes(response.data.transaction_types)
      } catch (error) {
        if (ignore) {
          return
        }

        if (error.response?.status === 401) {
          handleUnauthorized()
          return
        }

        setTransactionTypes(DEFAULT_TRANSACTION_TYPES)
        setOptionsMessage('Could not load transaction types. Using available defaults instead.')
      }
    }

    const loadInitialCategories = async () => {
      try {
        const response = await getTransactionCategories()

        if (ignore) {
          return
        }

        setTransactionCategories(response.data.categories)
      } catch (error) {
        if (ignore) {
          return
        }

        if (error.response?.status === 401) {
          handleUnauthorized()
          return
        }

        setTransactionCategories(DEFAULT_TRANSACTION_CATEGORIES)
        setOptionsMessage('Could not load transaction categories. Using available defaults instead.')
      }
    }

    void loadInitialSummary()
    void loadInitialTypes()
    void loadInitialCategories()

    return () => {
      ignore = true
    }
  }, [handleUnauthorized])

  useEffect(() => {
    let ignore = false

    const loadFilteredTransactions = async () => {
      try {
        const response = await getTransactions(filters)

        if (ignore) {
          return
        }

        setTransactions(response.data)
        setPageMessage('')
      } catch (error) {
        if (ignore) {
          return
        }

        if (error.response?.status === 401) {
          handleUnauthorized()
          return
        }

        setTransactions([])
        setPageMessage('Could not load transactions.')
      } finally {
        if (!ignore) {
          setIsLoadingTransactions(false)
        }
      }
    }

    void loadFilteredTransactions()

    return () => {
      ignore = true
    }
  }, [filters, handleUnauthorized])

  const handleFilterChange = (name, value) => {
    setIsLoadingTransactions(true)
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const handleClearFilters = () => {
    setIsLoadingTransactions(true)
    setFilters(INITIAL_FILTERS)
  }

  const handleSubmitTransaction = async (payload) => {
    try {
      setIsSavingTransaction(true)
      setIsLoadingTransactions(true)
      setIsLoadingSummary(true)
      setFormMessage('')
      setPageMessage('')

      if (editingTransaction) {
        await updateTransaction(editingTransaction.transaction_id, payload)
      } else {
        await createTransaction(payload)
      }

      await Promise.all([loadTransactions(filters), loadSummary()])
      setEditingTransaction(null)
      return true
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized()
        return false
      }

      setFormMessage(getApiErrorMessage(error, 'Could not save transaction.'))
      return false
    } finally {
      setIsSavingTransaction(false)
    }
  }

  const handleDeleteTransaction = async (transaction) => {
    try {
      setActiveDeleteId(transaction.transaction_id)
      setIsLoadingTransactions(true)
      setIsLoadingSummary(true)
      setPageMessage('')
      await deleteTransaction(transaction.transaction_id)

      if (editingTransaction?.transaction_id === transaction.transaction_id) {
        setEditingTransaction(null)
      }

      await Promise.all([loadTransactions(filters), loadSummary()])
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized()
        return
      }

      setPageMessage('Could not delete transaction.')
    } finally {
      setActiveDeleteId(null)
    }
  }

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction)
    setFormMessage('')
  }

  const handleCancelEdit = () => {
    setEditingTransaction(null)
    setFormMessage('')
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        <section className="space-y-2">
          <h2 className="section-title">Transactions</h2>
          <p className="section-copy text-sm leading-7 sm:text-base">
            Manage your income and expenses in one place.
          </p>
        </section>

        {pageMessage ? (
          <div
            className="rounded-xl border px-4 py-3 text-sm text-slate-200"
            style={{
              borderColor: 'var(--spfa-border-accent)',
              background: 'rgba(15, 17, 23, 0.78)',
            }}
          >
            {pageMessage}
          </div>
        ) : null}

        {optionsMessage ? (
          <div
            className="rounded-xl border px-4 py-3 text-sm text-slate-200"
            style={{
              borderColor: 'var(--spfa-border-accent)',
              background: 'rgba(15, 17, 23, 0.78)',
            }}
          >
            {optionsMessage}
          </div>
        ) : null}

        <TransactionSummaryCards summary={summary} isLoading={isLoadingSummary} />

        <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.65fr)]">
          <TransactionForm
            key={editingTransaction?.transaction_id ?? 'create'}
            transactionCategories={transactionCategories}
            transactionTypes={transactionTypes}
            initialTransaction={editingTransaction}
            onSubmit={handleSubmitTransaction}
            onCancelEdit={handleCancelEdit}
            isSubmitting={isSavingTransaction}
            serverMessage={formMessage}
          />

          <div className="space-y-6">
            <TransactionFilters
              filters={filters}
              transactionCategories={transactionCategories}
              transactionTypes={transactionTypes}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
            />
            <TransactionTable
              transactionCategories={transactionCategories}
              transactions={transactions}
              isLoading={isLoadingTransactions}
              activeDeleteId={activeDeleteId}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default Transactions
