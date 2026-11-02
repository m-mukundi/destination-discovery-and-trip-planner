import { useState } from 'react'
import { Alert, Box, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink, Navigate, useLocation } from 'react-router-dom'
import AuthLayout, { PillButton, PillField } from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { validateEmail, validatePassword, validateRequired } from '../utils/validation'

export default function Signup() {
  const { user, register } = useAuth()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={from} replace />

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {
      first_name: validateRequired(form.first_name, 'First name'),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirm_password:
        form.confirm_password === form.password ? '' : 'Passwords do not match',
    }
    setErrors(next)
    setServerError('')
    if (Object.values(next).some(Boolean)) return

    setSubmitting(true)
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        name: `${form.first_name} ${form.last_name}`.trim(),
      })
    } catch (error) {
      setServerError(error.message)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Please enter your details to sign up">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <PillField
              id="first_name"
              label="First name"
              placeholder="First name"
              autoComplete="given-name"
              value={form.first_name}
              onChange={set('first_name')}
              error={errors.first_name}
            />
            <PillField
              id="last_name"
              label="Last name"
              placeholder="Last name"
              autoComplete="family-name"
              value={form.last_name}
              onChange={set('last_name')}
            />
          </Stack>
          <PillField
            id="email"
            label="Email address"
            type="email"
            placeholder="Email address"
            autoComplete="email"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
          />
          <PillField
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••••"
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
          />
          <PillField
            id="confirm_password"
            label="Confirm password"
            type="password"
            placeholder="••••••••••"
            autoComplete="new-password"
            value={form.confirm_password}
            onChange={set('confirm_password')}
            error={errors.confirm_password}
          />

          <Typography sx={{ fontSize: 13, color: 'text.secondary', pl: 1 }}>
            At least 8 characters, with a letter and a number.
          </Typography>

          <PillButton type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Sign up'}
          </PillButton>
        </Stack>
      </Box>

      <Typography sx={{ textAlign: 'center', mt: 3 }}>
        Already have an account?{' '}
        <Link component={RouterLink} to="/login" state={location.state} underline="hover" fontWeight={600}>
          Sign in
        </Link>
      </Typography>
    </AuthLayout>
  )
}
