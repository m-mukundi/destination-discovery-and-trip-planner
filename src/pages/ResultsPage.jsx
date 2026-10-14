import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DestinationCard from '../components/DestinationCard';
import { selectDestination } from '../utils/place';

export default function ResultsPage() {
  const navigate = useNavigate();

  const storedResults = sessionStorage.getItem('nominatimResults');
  const query = sessionStorage.getItem('destinationQuery') || '';

  let results = [];

  try {
    results = storedResults ? JSON.parse(storedResults) : [];
  } catch (error) {
    console.error('Could not read stored Nominatim results:', error);
  }

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

      <Typography variant="h3" component="h1" sx={{ fontSize: 44 }}>
        {results.length} {results.length === 1 ? 'destination' : 'destinations'} found
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
          </Typography>
        </Box>
      ) : (
        results.map((r, index) => (
          <DestinationCard
            key={`${r.osm_type}-${r.osm_id}-${r.place_id}`}
            destination={r}
            index={index}
            onClick={() => handleDestinationClick(r)}
          />
        ))
      )}
    </Container>
  );
}