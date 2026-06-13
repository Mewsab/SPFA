import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getCurrentUser } from '../api/authApi'
import { isAuthenticated, removeToken } from '../utils/authStorage'

function UserRoute({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      return
    }

    const controller = new AbortController()

    const verifyUserRole = async () => {
      try {
        const response = await getCurrentUser({ signal: controller.signal })
        setCurrentUser(response.data)
      } catch (error) {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          return
        }

        removeToken()
        setSessionExpired(true)
      } finally {
        setIsLoading(false)
      }
    }

    void verifyUserRole()

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
      <div className="app-shell flex min-h-screen items-center justify-center px-4">
        <p className="text-sm font-medium text-slate-300">Checking account access...</p>
      </div>
    )
  }

  if (currentUser?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return children
}

export default UserRoute
