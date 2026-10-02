import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, ButtonBase } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlaceIcon from '@mui/icons-material/Place';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const tiles = [
  'linear-gradient(160deg, #B9DCDD, #0B4F5C)',
  'linear-gradient(160deg, #F1E4C8, #7FBFC2)',
  'linear-gradient(160deg, #DCEEEE, #0B4F5C)',
];

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
    sessionStorage.setItem(
      'selectedDestination',
      JSON.stringify(destination)
    );

    navigate('/destination');
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}
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
            textAlign: 'center'
          }}
        >
          <Typography variant="h5">
            No destinations found
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            We couldn't find a destination matching "{query}".
          </Typography>
        </Box>
      ) : (
        results.map((r, index) => {
          const region =
            r.address?.county ||
            r.address?.state ||
            r.address?.country ||
            'Kenya';

          return (
            <ButtonBase
              key={`${r.osm_type}-${r.osm_id}-${r.place_id}`}
              onClick={() => handleDestinationClick(r)}
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: 3,
                width: '100%',
                p: 2.5,
                pr: 3.5,
                textAlign: 'left',
                bgcolor: '#fff',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '28px',
                boxShadow: '0 2px 8px rgba(11,79,92,0.08)'
              }}
            >
              <Box
                sx={{
                  width: 88,
                  height: 88,
                  flexShrink: 0,
                  borderRadius: '20px',
                  background: tiles[index % tiles.length],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}
              >
                <PlaceIcon fontSize="large" />
              </Box>

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontSize: 28,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {r.name || r.display_name}
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    fontSize: 18,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {region}
                </Typography>
              </Box>

              <Box
                sx={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  borderRadius: '24px',
                  bgcolor: '#DCEEEE',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronRightIcon />
              </Box>
            </ButtonBase>
          );
        })
      )}
    </Container>
  );
}