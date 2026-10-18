import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  InputBase,
  TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { searchDestinations } from '../services/destinations';
import DestinationCard from '../components/DestinationCard';
import DateRangeCalendar from '../components/DateRangeCalendar';
import { useTrips } from '../context/TripContext';
import { placeKey, placeName, placeRegion } from '../utils/place';

function Step({ number, title, children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h3" sx={{ fontSize: 28 }}>
        {number}. {title}
      </Typography>
      {children}
    </Box>
  );
}

export default function CreateTripPage() {
  const navigate = useNavigate();
  const { createTrip, getTripForDestination } = useTrips();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [stay, setStay] = useState('');
  const [dates, setDates] = useState({ start: null, end: null });
  const [creating, setCreating] = useState(false);

  const existingTrip = selected ? getTripForDestination(selected) : null;

  const search = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setError('Please enter a destination.');
      return;
    }

    setSearching(true);
    setError('');
    try {
      const found = await searchDestinations(q);
      setResults(found);
      if (found.length === 0) setError(`No destinations found for "${q}".`);
    } catch (err) {
      console.error('Destination search failed:', err);
      setError('Unable to search for destinations. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const id = await createTrip(selected, {
        accommodation: stay.trim(),
        dates: dates.start ? dates : null,
      });
      navigate(`/trip/${id}`);
    } catch (err) {
      console.error('Could not create trip:', err);
      setError('Could not create the trip. Please try again.');
      setCreating(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ alignSelf: 'flex-start' }}
      >
        Back
      </Button>

      <Typography variant="h3" component="h1" sx={{ fontSize: 44 }}>
        Create a trip
      </Typography>

      <Step number={1} title="Choose a destination">
        {selected ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2.5,
              bgcolor: '#DCEEEE',
              borderRadius: '28px',
            }}
          >
            <CheckCircleIcon color="primary" />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h3" sx={{ fontSize: 24 }}>
                {placeName(selected)}
              </Typography>
              <Typography color="text.secondary">{placeRegion(selected)}</Typography>
            </Box>
            <Button onClick={() => setSelected(null)}>Change</Button>
          </Box>
        ) : (
          <>
            <Box
              component="form"
              onSubmit={search}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                height: 64,
                pl: 3,
                pr: 1,
                bgcolor: '#fff',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '32px',
              }}
            >
              <SearchIcon color="action" />
              <InputBase
                fullWidth
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a destination"
                inputProps={{ 'aria-label': 'Search for a destination' }}
                sx={{ fontSize: 18 }}
              />
              <Button type="submit" variant="contained" disabled={searching}>
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </Box>

            {error && <Typography color="error">{error}</Typography>}

            {results.map((r, index) => (
              <DestinationCard
                key={`${placeKey(r)}-${r.place_id}`}
                destination={r}
                index={index}
                showStar={false}
                onClick={() => setSelected(r)}
              />
            ))}
          </>
        )}
      </Step>

      {selected && (
        <>
          {existingTrip ? (
            <Box
              sx={{
                p: 3,
                bgcolor: '#fff',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '28px',
              }}
            >
              <Typography sx={{ fontWeight: 500 }}>
                You already have a trip for {placeName(selected)}.
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => navigate(`/trip/${existingTrip.id}`)}
              >
                View Trip for This Place
              </Button>
            </Box>
          ) : (
            <>
              <Step number={2} title="Place to stay (optional)">
                <TextField
                  value={stay}
                  onChange={(e) => setStay(e.target.value)}
                  placeholder="Hotel, rental or friend's place"
                  fullWidth
                  inputProps={{ 'aria-label': 'Place to stay' }}
                  sx={{ bgcolor: '#fff', borderRadius: '24px' }}
                />
              </Step>

              <Step number={3} title="Travel dates">
                <Box sx={{ bgcolor: '#DCEEEE', borderRadius: '32px', p: 3, maxWidth: 400 }}>
                  <DateRangeCalendar value={dates} onChange={setDates} />
                </Box>
              </Step>

              <Box>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create trip'}
                </Button>
                {error && (
                  <Typography color="error" sx={{ mt: 1.5 }}>
                    {error}
                  </Typography>
                )}
                <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                  You can add your itinerary on the next screen.
                </Typography>
              </Box>
            </>
          )}
        </>
      )}
    </Container>
  );
}