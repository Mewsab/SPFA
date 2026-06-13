import { cloneElement, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getCurrentUser } from '../api/authApi'
import { isAuthenticated, removeToken } from '../utils/authStorage'

function AdminRoute({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDenied, setIsDenied] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      return
    }

    const controller = new AbortController()

    const verifyAdminRole = async () => {
      try {
        const response = await getCurrentUser({ signal: controller.signal })

        if (response.data.role !== 'admin') {
          setIsDenied(true)
          return
        }

        setCurrentUser(response.data)
      } catch (error) {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          return
        }

        if (error.response?.status === 401) {
          removeToken()
          setSessionExpired(true)
          return
        }

        setIsDenied(true)
      } finally {
        setIsLoading(false)
      }
    }

    void verifyAdminRole()

    return () => {
      controller.abort()
    }
  }, [])

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (sessionExpired) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ message: 'Your session expired. Please log in again.' }}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center px-4">
        <p className="text-sm font-medium text-slate-600">Checking admin access...</p>
      </div>
    )
  }

  if (isDenied) {
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

  return cloneElement(children, { currentUser })
}

export default AdminRoute
