import { Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Transactions from '../pages/Transactions'
import AIBudgetingInsights from '../pages/AIBudgetingInsights'
import Investments from '../pages/Investments'
import AdminDashboard from '../pages/AdminDashboard'
import AdminRoute from './AdminRoute'
import UserRoute from './UserRoute'

function NotFoundRedirect() {
  return <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <UserRoute>
            <Dashboard />
          </UserRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <UserRoute>
            <Transactions />
          </UserRoute>
        }
      />
      <Route
        path="/ai-budgeting-insights"
        element={
          <UserRoute>
            <AIBudgetingInsights />
          </UserRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/ai-insights"
        element={
          <UserRoute>
            <Navigate to="/ai-budgeting-insights" replace />
          </UserRoute>
        }
      />
      <Route
        path="/budgets"
        element={
          <UserRoute>
            <Navigate to="/ai-budgeting-insights" replace />
          </UserRoute>
        }
      />
      <Route
        path="/investment"
        element={
          <UserRoute>
            <Navigate to="/dashboard" replace />
          </UserRoute>
        }
      />
      <Route
        path="/investments"
        element={
          <UserRoute>
            <Investments />
          </UserRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <UserRoute>
            <Navigate to="/dashboard" replace />
          </UserRoute>
        }
      />
      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  )
}

export default AppRoutes
