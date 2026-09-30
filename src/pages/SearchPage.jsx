import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, InputBase, Button, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const popular = ['Mombasa', 'Diani Beach', 'Malindi', 'Lamu'];

export default function SearchPage() {
  const navigate = useNavigate();
  const goToResults = (e) => {
    if (e) e.preventDefault();
    navigate('/results');
  };

  return (
    <Container
      maxWidth="md"
      sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 3 }}
    >
      <Typography variant="h2" component="h1">Search for a destination</Typography>
      <Typography color="text.secondary" sx={{ fontSize: 20, maxWidth: 560 }}>
        Check the weather, read about the place and find things to do before you go.
      </Typography>

      <Box
        component="form"
        onSubmit={goToResults}
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', maxWidth: 760, height: 80, pl: 3.5, pr: 1.5, bgcolor: '#fff', border: '1px solid', borderColor: 'divider', borderRadius: '40px', boxShadow: '0 8px 24px rgba(11,79,92,0.12)' }}
      >
        <SearchIcon color="action" />
        <InputBase fullWidth placeholder="Try Mombasa, Diani or Malindi" inputProps={{ 'aria-label': 'Search for a destination' }} sx={{ fontSize: 20 }} />
        <Button type="submit" variant="contained" size="large">Search</Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 1.5 }}>
        <Typography color="text.secondary">Popular on the coast</Typography>
        {popular.map((name) => (
          <Chip key={name} label={name} clickable onClick={goToResults} sx={{ bgcolor: '#fff', border: '1px solid', borderColor: 'divider' }} />
        ))}
      </Box>
    </Container>
  );
}