import { useState } from 'react'
import { Box, Button, TextField, Typography } from '@mui/material'

// Page wrapper: centred column with the serif heading
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            component="h1"
            sx={{
              fontFamily: '"Fraunces", Georgia, serif',
              fontWeight: 600,
              fontSize: { xs: 34, sm: 40 },
              lineHeight: 1.1,
              color: 'text.primary',
              mb: 1.5,
            }}
          >
            {title}
          </Typography>
          <Typography sx={{ color: 'text.primary' }}>{subtitle}</Typography>
        </Box>
        {children}
      </Box>
    </Box>
  )
}

// Label above a rounded pill input, like the search bar
export function PillField({ id, label, type = 'text', placeholder, autoComplete }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        component="label"
        htmlFor={id}
        sx={{ display: 'block', fontSize: 14, fontWeight: 500, pl: 1, mb: 1 }}
      >
        {label}
      </Typography>
      <Box sx={{ position: 'relative' }}>
        <TextField
          id={id}
          name={id}
          fullWidth
          type={isPassword && show ? 'text' : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 999,
              bgcolor: '#fff',
              boxShadow: '0 6px 18px rgba(20, 80, 95, 0.06)',
            },
            '& .MuiOutlinedInput-input': {
              py: 1.7,
              pl: 2.75,
              pr: isPassword ? 8 : 2.75,
            },
          }}
        />
        {isPassword && (
          <Button
            type="button"
            size="small"
            onClick={() => setShow((s) => !s)}
            sx={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              minWidth: 0,
              textTransform: 'none',
            }}
          >
            {show ? 'Hide' : 'Show'}
          </Button>
        )}
      </Box>
    </Box>
  )
}

// Teal pill button, like "Create a Trip"
export function PillButton({ children, ...props }) {
  return (
    <Button
      variant="contained"
      color="primary"
      fullWidth
      {...props}
      sx={{
        height: 54,
        borderRadius: 999,
        textTransform: 'none',
        fontSize: 16,
        fontWeight: 500,
        ...props.sx,
      }}
    >
      {children}
    </Button>
  )
}