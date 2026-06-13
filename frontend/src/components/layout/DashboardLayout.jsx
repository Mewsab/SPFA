import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { removeToken } from '../../utils/authStorage'
import { getCurrentUser } from '../../api/authApi'

function getFirstName(user) {
  const firstName = user?.first_name || user?.firstName

  return typeof firstName === 'string' ? firstName.trim() : ''
}

function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    removeToken()
    navigate('/login')
  }

  useEffect(() => {
    const controller = new AbortController()

    const loadCurrentUser = async () => {
      try {
        const response = await getCurrentUser({ signal: controller.signal })
        setFirstName(getFirstName(response.data))
        setIsAdmin(response.data.role === 'admin')
      } catch (error) {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          return
        }

        if (error.response?.status === 401) {
          removeToken()
          navigate('/login', {
            replace: true,
            state: { message: 'Your session expired. Please log in again.' },
          })
        }
      }
    }

    void loadCurrentUser()

    return () => {
      controller.abort()
    }
  }, [navigate])

  const handleMenuToggle = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen((current) => !current)
      return
    }

    setSidebarCollapsed((current) => !current)
  }

  return (
    <div className="app-shell px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-none gap-4 lg:gap-6">
        <Sidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          isAdmin={isAdmin}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="app-main flex min-h-[calc(100vh-2rem)] min-w-0 flex-1 flex-col gap-4 md:pl-0">
          <Topbar
            firstName={firstName}
            isSidebarCollapsed={sidebarCollapsed}
            onMenuClick={handleMenuToggle}
            onLogout={handleLogout}
          />
          <div className="min-w-0 flex-1">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
