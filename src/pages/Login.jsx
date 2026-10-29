import { Box, Checkbox, FormControlLabel, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import AuthLayout, { PillButton, PillField } from '../components/AuthLayout'

export default function Login() {
  // Skeleton only: the form doesn't do anything yet
  const handleSubmit = (e) => e.preventDefault()

  return (
    <AuthLayout title="Welcome back" subtitle="Please enter your details to sign in">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          <PillField
            id="identifier"
            label="Email address or username"
            placeholder="Email address or username"
            autoComplete="username"
          />
          <PillField
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••••"
            autoComplete="current-password"
          />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <FormControlLabel control={<Checkbox size="small" />} label="Remember me" />
            <Link href="#" underline="always" color="primary" fontSize={14}>
              Forgot password?
            </Link>
          </Stack>

          <PillButton type="submit">Sign in</PillButton>
        </Stack>
      </Box>

      <Typography sx={{ textAlign: 'center', mt: 3 }}>
        Don&apos;t have an account?{' '}
        <Link component={RouterLink} to="/signup" underline="hover" fontWeight={600}>
          Sign up
        </Link>
      </Typography>
    </AuthLayout>
  )
}