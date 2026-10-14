import { IconButton, Tooltip } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useTrips } from '../context/TripContext';

// Outlined star = not saved, filled star = saved. Same button everywhere.
export default function StarButton({ destination, size = 'medium', sx }) {
  const { isSaved, toggleSaved } = useTrips();
  const saved = isSaved(destination);
  const label = saved ? 'Remove from saved places' : 'Save this place';

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        aria-pressed={saved}
        size={size}
        onClick={(e) => {
          e.stopPropagation();
          toggleSaved(destination);
        }}
        sx={{ color: 'primary.main', ...sx }}
      >
        {saved ? <StarIcon /> : <StarBorderIcon />}
      </IconButton>
    </Tooltip>
  );
}