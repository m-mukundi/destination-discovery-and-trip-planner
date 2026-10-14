import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DestinationCard from '../components/DestinationCard';
import { useTrips } from '../context/TripContext';
import { formatRange } from '../utils/dates';
import { placeRegion } from '../utils/place';

export default function TripsPage() {
  const navigate = useNavigate();
  const { trips } = useTrips();

  return (
    <Container
      maxWidth="md"
      sx={{ py: 4, display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>
          New search
        </Button>
        <Button variant="contained" onClick={() => navigate('/trips/new')}>
          Create a Trip
        </Button>
      </Box>

      <Typography variant="h3" component="h1" sx={{ fontSize: 44 }}>
        My Trips
      </Typography>

      {trips.length === 0 ? (
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
          <Typography variant="h5">No trips yet</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Create a trip from the home page or from any destination.
          </Typography>
        </Box>
      ) : (
        trips.map((trip, index) => (
          <DestinationCard
            key={trip.id}
            destination={trip.destination}
            index={index}
            title={trip.name}
            subtitle={`${placeRegion(trip.destination)} · ${formatRange(trip.dates)}`}
            showStar={false}
            showTripBadge={false}
            onClick={() => navigate(`/trip/${trip.id}`)}
          />
        ))
      )}
    </Container>
  );
}