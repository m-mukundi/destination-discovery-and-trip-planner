import { Box, ButtonBase, Tooltip, Typography } from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CardTravelIcon from '@mui/icons-material/CardTravel';
import StarButton from './StarButton';
import { useTrips } from '../context/TripContext';
import { placeName, placeRegion } from '../utils/place';

const tiles = [
  'linear-gradient(160deg, #B9DCDD, #0B4F5C)',
  'linear-gradient(160deg, #F1E4C8, #7FBFC2)',
  'linear-gradient(160deg, #DCEEEE, #0B4F5C)',
];

// One card used by Results, Saved Places, My Trips and the trip creation search.
export default function DestinationCard({
  destination,
  index = 0,
  onClick,
  title,
  subtitle,
  showStar = true,
  showTripBadge = true,
}) {
  const { getTripForDestination } = useTrips();
  const hasTrip = showTripBadge && !!getTripForDestination(destination);
  const hasIndicators = showStar || hasTrip;

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <ButtonBase
        onClick={onClick}
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 3,
          width: '100%',
          p: 2.5,
          pr: 3.5,
          pb: hasIndicators ? 4.5 : 2.5,
          textAlign: 'left',
          bgcolor: '#fff',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '28px',
          boxShadow: '0 2px 8px rgba(11,79,92,0.08)',
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
            color: '#fff',
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
              whiteSpace: 'nowrap',
            }}
          >
            {title || placeName(destination)}
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              fontSize: 18,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle || placeRegion(destination)}
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
            justifyContent: 'center',
            mb: hasIndicators ? 2 : 0,
          }}
        >
          <ChevronRightIcon />
        </Box>
      </ButtonBase>

      {hasIndicators && (
        <Box
          sx={{
            position: 'absolute',
            right: 22,
            bottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          {hasTrip && (
            <Tooltip title="You have a trip for this place">
              <Box
                aria-label="Trip planned"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.25,
                  height: 28,
                  borderRadius: '14px',
                  bgcolor: 'primary.main',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <CardTravelIcon sx={{ fontSize: 16 }} />
                Trip
              </Box>
            </Tooltip>
          )}
          {showStar && <StarButton destination={destination} size="small" />}
        </Box>
      )}
    </Box>
  );
}