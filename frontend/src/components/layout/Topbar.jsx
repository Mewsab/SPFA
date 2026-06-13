import { ChevronLeft, ChevronRight, LogOut, Menu } from 'lucide-react'

function Topbar({ firstName, isSidebarCollapsed, onMenuClick, onLogout }) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const title = firstName ? `Welcome back, ${firstName}` : 'Welcome back'

  return (
    <header className="soft-panel flex w-full flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="secondary-button px-3 py-3"
          onClick={onMenuClick}
          aria-label="Toggle navigation"
        >
          <span className="md:hidden">
            <Menu size={18} />
          </span>
          <span className="hidden md:inline-flex">
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </span>
        </button>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-400">{today}</p>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:justify-end">
        <button type="button" className="secondary-button gap-2" onClick={onLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}

export default Topbar
