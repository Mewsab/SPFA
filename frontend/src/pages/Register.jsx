import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import FormInput from '../components/auth/FormInput'
import OccupationSelect from '../components/auth/OccupationSelect'
import { registerUser } from '../api/authApi'

const omanPhonePattern = /^\+968\d{8}$/

function normalizePhoneNumber(phoneNumber) {
  return phoneNumber.replace(/\s+/g, '')
}

function getBackendErrorMessage(error) {
  const detail = error.response?.data?.detail

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(' ')
  }

  return 'Registration failed. Please review your details and try again.'
}

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone_number: '',
    occupation_type: 'other',
  })
  const [errors, setErrors] = useState({})
  const [serverMessage, setServerMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setServerMessage('')
  }

  const validate = () => {
    const nextErrors = {}
    const normalizedPhone = normalizePhoneNumber(formData.phone_number)

    if (!formData.first_name.trim()) {
      nextErrors.first_name = 'First name is required.'
    }

    if (!formData.last_name.trim()) {
      nextErrors.last_name = 'Last name is required.'
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.'
    }

    if (!formData.password.trim()) {
      nextErrors.password = 'Password is required.'
    }

    if (normalizedPhone && !omanPhonePattern.test(normalizedPhone)) {
      nextErrors.phone_number = 'Use Oman format +968 followed by exactly 8 digits.'
    }

    if (!formData.occupation_type) {
      nextErrors.occupation_type = 'Occupation type is required.'
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

    const payload = {
      ...formData,
      phone_number: formData.phone_number
        ? normalizePhoneNumber(formData.phone_number)
        : null,
    }

    try {
      setIsSubmitting(true)
      setServerMessage('')
      await registerUser(payload)
      navigate('/login', {
        state: { message: 'Account created successfully. You can log in now.' },
      })
    } catch (error) {
      setServerMessage(getBackendErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Create your personal finance workspace with secure access and AI-ready budgeting."
      footer={
        <p className="text-center text-sm text-slate-400">
          Already registered?{' '}
          <Link className="font-semibold text-cyan-300 hover:text-cyan-100" to="/login">
            Login here
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {serverMessage ? (
          <div className="rounded-lg border px-4 py-3 text-sm text-rose-200" style={{ borderColor: 'rgba(244, 114, 182, 0.28)', background: 'rgba(60, 17, 45, 0.4)' }}>
            {serverMessage}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="Enter your first name"
            autoComplete="given-name"
            error={errors.first_name}
            required
          />
          <FormInput
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Enter your last name"
            autoComplete="family-name"
            error={errors.last_name}
            required
          />
        </div>

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
          autoComplete="new-password"
          error={errors.password}
          required
        />
        <FormInput
          label="Phone Number"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          placeholder="+96891234567"
          autoComplete="tel"
          error={errors.phone_number}
        />
        <OccupationSelect
          value={formData.occupation_type}
          onChange={handleChange}
          error={errors.occupation_type}
        />

        <button className="primary-button w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Register'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default Register
