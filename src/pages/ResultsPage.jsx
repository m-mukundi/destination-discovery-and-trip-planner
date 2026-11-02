
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DestinationCard from '../components/DestinationCard';
import { selectDestination } from '../utils/place';
import { searchDestinations } from '../services/destinations';

// Read the previous search results from session storage.
const getStoredResults = () => {
  try {
    return JSON.parse(sessionStorage.getItem('nominatimResults') || '[]');
  } catch (error) {
    console.error('Could not read stored search results:', error);
    return [];
  }
};

// Convert Nominatim's place type into a readable label.
const getPlaceType = (destination) => {
  const type =
    destination.addresstype ||
    destination.type ||
    destination.class ||
    '';

  if (!type) return '';

  const labels = {
    administrative: 'Administrative area',
    national_park: 'National park',
    national: 'National area',
    neighbourhood: 'Neighbourhood',
    suburb: 'Suburb',
    city: 'City',
    town: 'Town',
    village: 'Village',
    county: 'County',
    state: 'State',
    country: 'Country',
  };

  const normalized = type.toLowerCase().replaceAll(' ', '_');

  return labels[normalized] ||
    normalized.replaceAll('_', ' ').replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

// Build a location description without repeating the destination name.
const getLocationContext = (destination) => {
  const address = destination.address || {};
  const destinationName = (destination.name || '').toLowerCase();

  const locationParts = [
    address.city,
    address.town,
    address.village,
    address.municipality,
    address.county,
    address.state,
    address.country,
  ]
    .filter(Boolean)
    .filter(
      (value, index, values) =>
        values.findIndex(
          (item) => item.toLowerCase() === value.toLowerCase()
        ) === index
    )
    .filter((value) => value.toLowerCase() !== destinationName);

  return locationParts.slice(0, 2).join(', ');
};

const getResultSubtitle = (destination) => {
  const type = getPlaceType(destination);
  const location = getLocationContext(destination);

  if (type && location) return `${type} · ${location}`;
  return type || location || destination.display_name || '';
};

export default function ResultsPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState(
    () => sessionStorage.getItem('destinationQuery') || ''
  );
  const [results, setResults] = useState(getStoredResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (event) => {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setError('Please enter a destination to search.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const nextResults = await searchDestinations(trimmedQuery);

      if (!Array.isArray(nextResults)) {
        throw new Error('Unexpected search response.');
      }

      setResults(nextResults);

      sessionStorage.setItem(
        'nominatimResults',
        JSON.stringify(nextResults)
      );
      sessionStorage.setItem('destinationQuery', trimmedQuery);
    } catch (searchError) {
      console.error('Destination search failed:', searchError);
      setError('Unable to search for destinations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDestinationClick = (destination) => {
    selectDestination(destination);
    navigate('/destination');
  };

  return (
    <Container
      maxWidth="md"
      sx={{ py: 4, display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ alignSelf: 'flex-start' }}
      >
        New search
      </Button>

      <Box component="form" onSubmit={handleSearch}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Refine your destination search
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for another destination..."
            inputProps={{ 'aria-label': 'Destination search' }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ minWidth: 110 }}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </Box>

        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </Box>

      <Typography variant="h3" component="h1" sx={{ fontSize: 44 }}>
        {results.length}{' '}
        {results.length === 1 ? 'destination' : 'destinations'} found
      </Typography>

      {results.length === 0 ? (
        <Box
          sx={{
            bgcolor: '#fff',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '28px',
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="h5">No destinations found</Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            We couldn't find a destination matching "{query}".
            Try a different search.
          </Typography>
        </Box>
      ) : (
        results.map((destination, index) => (
          <DestinationCard
            key={
              destination.place_key ||
              `${destination.osm_type}-${destination.osm_id}-${destination.place_id}`
            }
            destination={destination}
            index={index}
            subtitle={getResultSubtitle(destination)}
            onClick={() => handleDestinationClick(destination)}
          />
        ))
      )}
    </Container>
  );
}
