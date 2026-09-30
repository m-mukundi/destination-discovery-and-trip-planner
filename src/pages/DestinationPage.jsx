import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AttractionsIcon from '@mui/icons-material/Attractions';
import MuseumIcon from '@mui/icons-material/Museum';
import ParkIcon from '@mui/icons-material/Park';
import WbCloudyIcon from '@mui/icons-material/WbCloudy';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AirIcon from '@mui/icons-material/Air';

const explore = [
  { label: 'Attractions', hint: 'Fort Jesus, Old Town, Nyali Beach', icon: <AttractionsIcon /> },
  { label: 'Museums', hint: 'Fort Jesus Museum', icon: <MuseumIcon /> },
  { label: 'Parks', hint: 'Haller Park, Mombasa Marine National Park', icon: <ParkIcon /> },
];

export default function DestinationPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/results')}>Back to results</Button>

      <Box sx={{ display: 'grid', gap: 6, mt: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 400px' } }}>
        <Box>
          <Typography variant="h2" component="h1">Mombasa, Kenya</Typography>
          <Typography color="text.secondary" sx={{ my: 3, fontSize: 20, maxWidth: 640, lineHeight: 1.6 }}>
            Mombasa is a coastal city in southeastern Kenya, set on the Indian Ocean. Its historic Old Town,
            the sixteenth-century Fort Jesus and long stretches of white-sand beach make it a popular stop
            for beach and history lovers alike.
          </Typography>

          <Box sx={{ bgcolor: 'primary.main', color: '#fff', p: 4, borderRadius: '32px' }}>
            <Typography variant="h3" sx={{ fontSize: 32, mb: 2 }}>Explore Mombasa</Typography>
            <List disablePadding>
              {explore.map((item) => (
                <ListItemButton key={item.label} sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '20px', mb: 1.5, py: 2 }}>
                  <ListItemIcon sx={{ color: '#fff' }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    secondary={item.hint}
                    sx={{ '& .MuiListItemText-secondary': { color: '#BFE0E0' } }}
                  />
                  <ChevronRightIcon />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25, p: 3.5, bgcolor: '#DCEEEE', borderRadius: '32px', alignSelf: 'start' }}>
          <Typography sx={{ fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'primary.main' }}>
            Weather now
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'primary.main' }}>
            <WbCloudyIcon sx={{ fontSize: 64 }} />
            <Typography variant="h2" sx={{ fontSize: 72, lineHeight: 1 }}>29°C</Typography>
          </Box>
          <Typography sx={{ fontSize: 22, fontWeight: 500 }}>Partly cloudy</Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.25, p: 2, bgcolor: '#fff', borderRadius: '20px', color: 'primary.main' }}>
              <WaterDropIcon />
              <Box>
                <Typography color="text.secondary">Humidity</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 20, color: 'text.primary' }}>74%</Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.25, p: 2, bgcolor: '#fff', borderRadius: '20px', color: 'primary.main' }}>
              <AirIcon />
              <Box>
                <Typography color="text.secondary">Wind</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 20, color: 'text.primary' }}>14 km/h</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}