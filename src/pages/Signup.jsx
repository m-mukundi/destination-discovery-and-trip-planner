import { Box, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import AuthLayout, { PillButton, PillField } from '../components/AuthLayout'

export default function Signup() {
  // Skeleton only: the form doesn't do anything yet
  const handleSubmit = (e) => e.preventDefault()

  return (
    <AuthLayout title="Create your account" subtitle="Please enter your details to sign up">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <PillField id="first_name" label="First name" placeholder="First name" autoComplete="given-name" />
            <PillField id="last_name" label="Last name" placeholder="Last name" autoComplete="family-name" />
          </Stack>
          <PillField id="username" label="Username" placeholder="Choose a username" autoComplete="username" />
          <PillField id="email" label="Email address" type="email" placeholder="Email address" autoComplete="email" />
          <PillField id="password" label="Password" type="password" placeholder="••••••••••" autoComplete="new-password" />
          <PillField id="confirm_password" label="Confirm password" type="password" placeholder="••••••••••" autoComplete="new-password" />

          <PillButton type="submit">Sign up</PillButton>
        </Stack>
      </Box>

      <Typography sx={{ textAlign: 'center', mt: 3 }}>
        Already have an account?{' '}
        <Link component={RouterLink} to="/login" underline="hover" fontWeight={600}>
          Sign in
        </Link>
      </Typography>
    </AuthLayout>
  )
}