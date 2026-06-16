import { useCallback, useEffect, useState } from 'react'
import {
  FileSpreadsheet,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getAdminImportBatches,
  getAdminOverview,
  getAdminUsers,
  updateAdminUserRole,
  updateUserStatus,
} from '../api/adminApi'
import { removeToken } from '../utils/authStorage'

const EMPTY_OVERVIEW = {
  total_users: 0,
  total_transactions: 0,
  total_manual_transactions: 0,
  total_imported_transactions: 0,
  total_import_batches: 0,
  total_successful_import_rows: 0,
  total_failed_import_rows: 0,
}

const OVERVIEW_CARDS = [
  { key: 'total_users', label: 'Total Users' },
  { key: 'total_transactions', label: 'Total Transactions' },
  { key: 'total_manual_transactions', label: 'Manual Transactions' },
  { key: 'total_imported_transactions', label: 'Imported Transactions' },
  { key: 'total_import_batches', label: 'CSV Import Batches' },
  { key: 'total_failed_import_rows', label: 'Failed Import Rows' },
]

function formatUploadedAt(value) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

function AdminDashboard({ currentUser }) {
  const navigate = useNavigate()
  const [overview, setOverview] = useState(EMPTY_OVERVIEW)
  const [users, setUsers] = useState([])
  const [importBatches, setImportBatches] = useState([])
  const [isLoadingOverview, setIsLoadingOverview] = useState(true)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingImportBatches, setIsLoadingImportBatches] = useState(true)
  const [overviewMessage, setOverviewMessage] = useState('')
  const [usersMessage, setUsersMessage] = useState('')
  const [importBatchesMessage, setImportBatchesMessage] = useState('')
  const [roleUpdateMessage, setRoleUpdateMessage] = useState('')
  const [statusUpdateMessage, setStatusUpdateMessage] = useState('')
  const [activeRoleUpdateId, setActiveRoleUpdateId] = useState(null)
  const [activeStatusUpdateId, setActiveStatusUpdateId] = useState(null)
  const [isAccessDenied, setIsAccessDenied] = useState(false)

  const handleUnauthorized = useCallback(() => {
    removeToken()
    navigate('/login', {
      replace: true,
      state: { message: 'Your session expired. Please log in again.' },
    })
  }, [navigate])

  const handleApiError = useCallback(
    (error, setMessage, fallbackMessage) => {
      if (error.response?.status === 401) {
        handleUnauthorized()
        return
      }

      if (error.response?.status === 403) {
        setIsAccessDenied(true)
        return
      }

      setMessage(error.response?.data?.detail || fallbackMessage)
    },
    [handleUnauthorized],
  )

  const loadOverview = useCallback(async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) {
        setIsLoadingOverview(true)
        setOverviewMessage('')
      }
      const response = await getAdminOverview()
      setOverview(response.data)
    } catch (error) {
      setOverview(EMPTY_OVERVIEW)
      handleApiError(error, setOverviewMessage, 'Could not load admin overview.')
    } finally {
      setIsLoadingOverview(false)
    }
  }, [handleApiError])

  const loadUsers = useCallback(async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) {
        setIsLoadingUsers(true)
        setUsersMessage('')
      }
      const response = await getAdminUsers()
      setUsers(response.data)
    } catch (error) {
      setUsers([])
      handleApiError(error, setUsersMessage, 'Could not load users.')
    } finally {
      setIsLoadingUsers(false)
    }
  }, [handleApiError])

  const loadImportBatches = useCallback(async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) {
        setIsLoadingImportBatches(true)
        setImportBatchesMessage('')
      }
      const response = await getAdminImportBatches()
      setImportBatches(response.data)
    } catch (error) {
      setImportBatches([])
      handleApiError(error, setImportBatchesMessage, 'Could not load import batches.')
    } finally {
      setIsLoadingImportBatches(false)
    }
  }, [handleApiError])

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.resolve()
      await Promise.all([
        loadOverview({ showLoading: false }),
        loadUsers({ showLoading: false }),
        loadImportBatches({ showLoading: false }),
      ])
    }

    void loadInitialData()
  }, [loadImportBatches, loadOverview, loadUsers])

  const handleLogout = () => {
    removeToken()
    navigate('/login')
  }

  const handleRoleUpdate = async (user) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin'

    try {
      setActiveRoleUpdateId(user.user_id)
      setRoleUpdateMessage('')
      setStatusUpdateMessage('')
      await updateAdminUserRole(user.user_id, nextRole)
      await Promise.all([loadUsers(), loadOverview()])
    } catch (error) {
      handleApiError(error, setRoleUpdateMessage, 'Could not update user role.')
    } finally {
      setActiveRoleUpdateId(null)
    }
  }

  const handleStatusUpdate = async (user) => {
    const nextStatus = !user.is_active

    try {
      setActiveStatusUpdateId(user.user_id)
      setStatusUpdateMessage('')
      setRoleUpdateMessage('')
      await updateUserStatus(user.user_id, nextStatus)
      await loadUsers()
    } catch (error) {
      handleApiError(error, setStatusUpdateMessage, 'Could not update user status.')
    } finally {
      setActiveStatusUpdateId(null)
    }
  }

  if (isAccessDenied) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center px-4">
        <section className="admin-panel max-w-lg px-6 py-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">Access denied</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">Admin access required</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            You do not have permission to access the admin dashboard.
          </p>
          <Link className="admin-button-primary mt-6" to="/dashboard">
            Return to dashboard
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="admin-shell min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-5">
        <header className="admin-panel flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-800 p-3 text-white">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="admin-button-secondary" type="button" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-slate-900">System Overview</h2>
          </div>

          {overviewMessage ? <p className="admin-error">{overviewMessage}</p> : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {OVERVIEW_CARDS.map((card) => (
              <article className="admin-panel px-4 py-4" key={card.key}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">
                  {isLoadingOverview ? '-' : overview[card.key]}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Users className="text-slate-700" size={19} />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">User Management</h2>
              </div>
            </div>
            <button className="admin-button-secondary" type="button" onClick={loadUsers}>
              <RefreshCw size={15} />
              Refresh users
            </button>
          </div>

          {usersMessage ? <p className="admin-error mx-5 mt-4">{usersMessage}</p> : null}
          {roleUpdateMessage ? <p className="admin-error mx-5 mt-4">{roleUpdateMessage}</p> : null}
          {statusUpdateMessage ? <p className="admin-error mx-5 mt-4">{statusUpdateMessage}</p> : null}

          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Occupation</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan="8">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="8">No users found.</td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isCurrentAdmin = user.user_id === currentUser?.user_id
                    const isDemotingSelf = isCurrentAdmin && user.role === 'admin'
                    const isDeactivatingSelf = isCurrentAdmin && user.is_active
                    const isUpdating = activeRoleUpdateId === user.user_id
                    const isUpdatingStatus = activeStatusUpdateId === user.user_id

                    return (
                      <tr key={user.user_id}>
                        <td>{user.user_id}</td>
                        <td>{`${user.first_name} ${user.last_name}`}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={user.role === 'admin' ? 'admin-badge' : 'user-badge'}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={user.is_active ? 'admin-status-active' : 'admin-status-inactive'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{user.occupation_type || '-'}</td>
                        <td>{user.phone_number || '-'}</td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <button
                              className={user.role === 'admin' ? 'admin-button-danger' : 'admin-button-primary'}
                              type="button"
                              disabled={isDemotingSelf || isUpdating}
                              onClick={() => handleRoleUpdate(user)}
                              title={isDemotingSelf ? 'You cannot remove your own admin role.' : undefined}
                            >
                              {isUpdating
                                ? 'Updating...'
                                : user.role === 'admin'
                                  ? 'Demote to User'
                                  : 'Promote to Admin'}
                            </button>
                            <button
                              className={user.is_active ? 'admin-button-danger' : 'admin-button-primary'}
                              type="button"
                              disabled={isDeactivatingSelf || isUpdatingStatus}
                              onClick={() => handleStatusUpdate(user)}
                              title={isDeactivatingSelf ? 'You cannot deactivate your own account.' : undefined}
                            >
                              {isUpdatingStatus
                                ? 'Updating...'
                                : user.is_active
                                  ? 'Deactivate'
                                  : 'Reactivate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="text-slate-700" size={19} />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Import Batch Monitoring</h2>
              </div>
            </div>
            <button className="admin-button-secondary" type="button" onClick={loadImportBatches}>
              <RefreshCw size={15} />
              Refresh imports
            </button>
          </div>

          {importBatchesMessage ? <p className="admin-error mx-5 mt-4">{importBatchesMessage}</p> : null}

          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>User / Email</th>
                  <th>File Name</th>
                  <th>Total Rows</th>
                  <th>Successful Rows</th>
                  <th>Failed Rows</th>
                  <th>Status</th>
                  <th>Uploaded At</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingImportBatches ? (
                  <tr>
                    <td colSpan="8">Loading import batches...</td>
                  </tr>
                ) : importBatches.length === 0 ? (
                  <tr>
                    <td colSpan="8">No CSV import batches found.</td>
                  </tr>
                ) : (
                  importBatches.map((batch) => (
                    <tr key={batch.import_batch_id}>
                      <td>{batch.import_batch_id}</td>
                      <td>{batch.user_email || `User ${batch.user_id}`}</td>
                      <td>{batch.file_name}</td>
                      <td>{batch.total_rows}</td>
                      <td className="text-emerald-700">{batch.successful_rows}</td>
                      <td className="text-rose-700">{batch.failed_rows}</td>
                      <td>
                        <span className="user-badge">{batch.status}</span>
                      </td>
                      <td>{formatUploadedAt(batch.uploaded_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminDashboard
