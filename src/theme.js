import { createTheme } from '@mui/material/styles';

export default createTheme({
  palette: {
    primary: { main: '#0B4F5C' },
    background: { default: '#FBF6EC', paper: '#FFFFFF' },
    text: { primary: '#14302F', secondary: '#4A6462' },
    divider: '#D5DEDB',
  },
  shape: { borderRadius: 24 },
  typography: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    h1: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
    h2: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
    h3: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 999, padding: '12px 28px' } } },
    MuiChip: { styleOverrides: { root: { height: 44, borderRadius: 22, fontSize: 16 } } },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: '1px solid #D5DEDB', borderRadius: 28 } },
    },
  },
});