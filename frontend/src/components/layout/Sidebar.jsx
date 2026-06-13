import {
  BrainCircuit,
  CreditCard,
  LineChart,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Transactions', icon: ReceiptText, to: '/transactions' },
  { label: 'AI Budgeting Insights', icon: BrainCircuit, to: '/ai-budgeting-insights' },
  { label: 'Investments', icon: LineChart, to: '/investments' },
]

function Sidebar({ isOpen, isCollapsed, isAdmin, onClose }) {
  const visibleNavItems = isAdmin
    ? [{ label: 'Admin Dashboard', icon: ShieldCheck, to: '/admin' }]
    : navItems

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/25 transition md:hidden ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`soft-panel fixed inset-y-4 left-4 z-40 flex flex-col overflow-hidden bg-[var(--spfa-bg-deep)] p-4 transition-all duration-300 md:static md:inset-auto md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-[120%]'
        } ${isCollapsed ? 'w-[92px]' : 'w-[260px]'}`}
      >
        <div className="border-b pb-5" style={{ borderColor: 'var(--spfa-border)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border text-cyan-200" style={{ borderColor: 'var(--spfa-border-accent)', background: 'var(--spfa-accent)' }}>
              <CreditCard size={22} />
            </div>
            {!isCollapsed ? (
              <div>
                <p className="text-lg font-semibold text-white">SPFA</p>
                <p className="text-sm text-slate-400">Finance Assistant</p>
              </div>
            ) : null}
          </div>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {visibleNavItems.map(({ label, icon: Icon, to }) => {
            if (!to) {
              return (
                <div
                  key={label}
                  className="nav-item cursor-not-allowed opacity-70"
                  title={isCollapsed ? label : undefined}
                >
                  <Icon size={18} />
                  {!isCollapsed ? <span>{label}</span> : null}
                </div>
              )
            }

            return (
              <NavLink
                key={label}
                to={to}
                end
                className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? label : undefined}
              >
                <Icon size={18} />
                {!isCollapsed ? <span>{label}</span> : null}
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
