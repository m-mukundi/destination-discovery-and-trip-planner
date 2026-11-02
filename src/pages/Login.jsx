import { useState } from 'react'
import { Alert, Box, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink, Navigate, useLocation } from 'react-router-dom'
import AuthLayout, { PillButton, PillField } from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { validateEmail } from '../utils/validation'

export default function Login() {
  const { user, login } = useAuth()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already logged in (or just logged in): go to where the person was heading.
  if (user) return <Navigate to={from} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {
      email: validateEmail(email),
      password: password ? '' : 'Password is required',
    }
    setErrors(next)
    setServerError('')
    if (next.email || next.password) return

    setSubmitting(true)
    try {
      await login(email.trim(), password)
    } catch (error) {
      setServerError(error.message)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Please enter your details to sign in">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          {serverError && <Alert severity="error">{serverError}</Alert>}

          <PillField
            id="email"
            label="Email address"
            type="email"
            placeholder="Email address"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <PillField
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          <PillButton type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </PillButton>
        </Stack>
      </Box>

      <Typography sx={{ textAlign: 'center', mt: 3 }}>
        Don&apos;t have an account?{' '}
        <Link component={RouterLink} to="/signup" state={location.state} underline="hover" fontWeight={600}>
          Sign up
        </Link>
      </Typography>
    </AuthLayout>
  )
}
