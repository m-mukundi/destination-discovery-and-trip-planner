import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  InputBase,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import { searchDestinations } from '../services/destinations';
import SideNav from '../components/SideNav';

const popular = ['Mombasa', 'Diani Beach', 'Malindi', 'Lamu'];

export default function SearchPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const search = async (destination) => {
    const trimmedDestination = destination.trim();

    if (!trimmedDestination) {
      setError('Please enter a destination.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const results = await searchDestinations(trimmedDestination);

      sessionStorage.setItem('nominatimResults', JSON.stringify(results));
      sessionStorage.setItem('destinationQuery', trimmedDestination);

      navigate('/results');
    } catch (err) {
      console.error('Destination search failed:', err);
      setError('Unable to search for destinations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToResults = (e) => {
    e.preventDefault();
    search(query);
  };

  const handlePopularDestination = (name) => {
    setQuery(name);
    search(name);
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        gap: 3,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 24,
          right: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Button variant="contained" onClick={() => navigate('/trips/new')}>
          Create a Trip
        </Button>

        <IconButton
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          sx={{ color: 'primary.main' }}
        >
          <MenuIcon fontSize="large" />
        </IconButton>
      </Box>

      <SideNav open={menuOpen} onClose={() => setMenuOpen(false)} />

      <Typography variant="h2" component="h1">
        Search for a destination
      </Typography>

      <Typography color="text.secondary" sx={{ fontSize: 20, maxWidth: 560 }}>
        Check the weather, read about the place and find things to do before you go.
      </Typography>

      <Box
        component="form"
        onSubmit={goToResults}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          width: '100%',
          maxWidth: 760,
          height: 80,
          pl: 3.5,
          pr: 1.5,
          bgcolor: '#fff',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '40px',
          boxShadow: '0 8px 24px rgba(11,79,92,0.12)',
        }}
      >
        <SearchIcon color="action" />

        <InputBase
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try Mombasa, Diani or Malindi"
          inputProps={{ 'aria-label': 'Search for a destination' }}
          sx={{ fontSize: 20 }}
        />

        <Button type="submit" variant="contained" size="large" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </Box>

      {error && <Typography color="error">{error}</Typography>}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Typography color="text.secondary">Popular on the coast</Typography>

        {popular.map((name) => (
          <Chip
            key={name}
            label={name}
            clickable
            disabled={loading}
            onClick={() => handlePopularDestination(name)}
            sx={{ bgcolor: '#fff', border: '1px solid', borderColor: 'divider' }}
          />
        ))}
      </Box>
    </Container>
  );
}