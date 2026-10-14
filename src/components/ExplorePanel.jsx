import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AttractionsIcon from '@mui/icons-material/Attractions';
import ParkIcon from '@mui/icons-material/Park';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import useNearbyPlaces from '../hooks/useNearbyPlaces';

const HINT_PLACE_COUNT = 3;

const explore = [
  { key: 'attractions', label: 'Attractions', icon: <AttractionsIcon /> },
  { key: 'nature', label: 'Nature', icon: <ParkIcon /> },
  { key: 'food', label: 'Food & Drinks', icon: <RestaurantIcon /> },
];

function getHint(status, places = []) {
  if (status === 'loading') return 'Finding places nearby...';
  if (status === 'error') return "Couldn't load places right now";
  if (places.length === 0) return 'Nothing found nearby';

  return places
    .slice(0, HINT_PLACE_COUNT)
    .map((place) => place.name)
    .join(', ');
}

// The "Explore <place>" list, shared by the destination page and the trip page.
export default function ExplorePanel({ name, lat, lon }) {
  const nearby = useNearbyPlaces(lat, lon);

  return (
    <Box
      sx={{
        bgcolor: 'primary.main',
        color: '#fff',
        p: 4,
        borderRadius: '32px',
      }}
    >
      <Typography variant="h3" sx={{ fontSize: 32, mb: 2 }}>
        Explore {name}
      </Typography>

      <List disablePadding>
        {explore.map((item) => (
          <ListItemButton
            key={item.key}
            sx={{
              bgcolor: 'rgba(255,255,255,0.1)',
              borderRadius: '20px',
              mb: 1.5,
              py: 2,
            }}
          >
            <ListItemIcon sx={{ color: '#fff' }}>{item.icon}</ListItemIcon>

            <ListItemText
              primary={item.label}
              secondary={getHint(nearby.status, nearby.categories?.[item.key])}
              sx={{ '& .MuiListItemText-secondary': { color: '#BFE0E0' } }}
            />

            <ChevronRightIcon />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}