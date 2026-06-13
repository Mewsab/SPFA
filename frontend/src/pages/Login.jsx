import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import FormInput from '../components/auth/FormInput'
import { getCurrentUser, loginUser } from '../api/authApi'
import { removeToken, saveToken } from '../utils/authStorage'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [serverMessage, setServerMessage] = useState(location.state?.message || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setServerMessage('')
  }

  const validate = () => {
    const nextErrors = {}

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.'
    }

    if (!formData.password.trim()) {
      nextErrors.password = 'Password is required.'
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

    try {
      setIsSubmitting(true)
      setServerMessage('')
      const response = await loginUser(formData)
      saveToken(response.data.access_token)
      const currentUserResponse = await getCurrentUser()
      navigate(currentUserResponse.data.role === 'admin' ? '/admin' : '/dashboard', {
        replace: true,
      })
    } catch (error) {
      removeToken()
      setServerMessage(error.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue with secure tracking, budgeting, and AI-ready insights."
      footer={
        <p className="text-center text-sm text-slate-400">
          New here?{' '}
          <Link className="font-semibold text-cyan-300 hover:text-cyan-100" to="/register">
            Create an account
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {serverMessage ? (
          <div className="rounded-lg border px-4 py-3 text-sm text-slate-200" style={{ borderColor: 'var(--spfa-border-accent)', background: 'rgba(15, 17, 23, 0.78)' }}>
            {serverMessage}
          </div>
        ) : null}

        <FormInput
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="name@example.com"
          autoComplete="email"
          error={errors.email}
          required
        />
        <FormInput
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password}
          required
        />

        <button className="primary-button w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default Login
