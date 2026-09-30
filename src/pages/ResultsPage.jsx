import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, ButtonBase } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlaceIcon from '@mui/icons-material/Place';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const results = [
  { name: 'Mombasa, Kenya', region: 'Mombasa County', tile: 'linear-gradient(160deg, #B9DCDD, #0B4F5C)' },
  { name: 'Diani Beach, Kenya', region: 'Kwale County', tile: 'linear-gradient(160deg, #F1E4C8, #7FBFC2)' },
  { name: 'Malindi, Kenya', region: 'Kilifi County', tile: 'linear-gradient(160deg, #DCEEEE, #0B4F5C)' },
];

export default function ResultsPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ alignSelf: 'flex-start' }}>
        New search
      </Button>
      <Typography variant="h3" component="h1" sx={{ fontSize: 44 }}>3 destinations found</Typography>

      {results.map((r) => (
        <ButtonBase
          key={r.name}
          onClick={() => navigate('/destination')}
          sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 3, width: '100%', p: 2.5, pr: 3.5, textAlign: 'left', bgcolor: '#fff', border: '1px solid', borderColor: 'divider', borderRadius: '28px', boxShadow: '0 2px 8px rgba(11,79,92,0.08)' }}
        >
          <Box sx={{ width: 88, height: 88, flexShrink: 0, borderRadius: '20px', background: r.tile, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <PlaceIcon fontSize="large" />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h3" sx={{ fontSize: 28 }}>{r.name}</Typography>
            <Typography color="text.secondary" sx={{ fontSize: 18 }}>{r.region}</Typography>
          </Box>
          <Box sx={{ width: 48, height: 48, borderRadius: '24px', bgcolor: '#DCEEEE', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRightIcon />
          </Box>
        </ButtonBase>
      ))}
    </Container>
  );
}