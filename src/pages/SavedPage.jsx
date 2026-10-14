import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DestinationCard from '../components/DestinationCard';
import { useTrips } from '../context/TripContext';
import { selectDestination } from '../utils/place';

export default function SavedPage() {
  const navigate = useNavigate();
  const { savedPlaces } = useTrips();

  const open = (destination) => {
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

      <Typography variant="h3" component="h1" sx={{ fontSize: 44 }}>
        Saved Places
      </Typography>

      {savedPlaces.length === 0 ? (
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
          <Typography variant="h5">No saved places yet</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Tap the star on a destination to keep it here.
          </Typography>
        </Box>
      ) : (
        savedPlaces.map((place, index) => (
          <DestinationCard
            key={`${place.osm_type}-${place.osm_id}-${place.place_id}`}
            destination={place}
            index={index}
            onClick={() => open(place)}
          />
        ))
      )}
    </Container>
  );
}