import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import OverviewCard from '../components/OverviewCard';
import WeatherCard from '../components/WeatherCard';
import ExplorePanel from '../components/ExplorePanel';
import StarButton from '../components/StarButton';
import { useTrips } from '../context/TripContext';
import { placeRegion, selectDestination } from '../utils/place';
import { formatLong, formatRange, toISO } from '../utils/dates';

export default function TripPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    status,
    getTripById,
    updateTrip,
    deleteTrip,
    addItineraryItem,
    removeItineraryItem,
  } = useTrips();

  const trip = getTripById(id);

  const [stay, setStay] = useState(null); // null = show the saved value
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');

  if (!trip) {
    const message = {
      loading: 'Loading trip...',
      error: "Couldn't load your trips. Please try again later.",
    }[status] || 'Trip not found';

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/trips')}>
          My trips
        </Button>
        <Typography variant="h4" sx={{ mt: 4 }}>
          {message}
        </Typography>
      </Container>
    );
  }

  const destination = trip.destination;
  const itineraryDates = Object.keys(trip.itinerary).sort();

  const openDialog = () => {
    setDate(trip.dates.start || toISO(new Date()));
    setTime('');
    setTitle('');
    setDialogOpen(true);
  };

  const saveItem = () => {
    if (!title.trim() || !date) return;
    addItineraryItem(trip.id, date, { title: title.trim(), time });
    setDialogOpen(false);
  };

  const saveStay = () => {
    if (stay !== null) updateTrip(trip.id, { accommodation: stay.trim() });
    setStay(null);
  };

  const viewDestination = () => {
    selectDestination(destination);
    navigate('/destination');
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete your trip to ${trip.name}?`)) return;
    try {
      await deleteTrip(trip.id);
      navigate('/trips');
    } catch (error) {
      console.error('Could not delete trip:', error);
      window.alert('Could not delete the trip. Please try again.');
    }
  };

  const calendar = {
    value: trip.dates,
    onChange: (dates) => updateTrip(trip.id, { dates }),
    markedDates: itineraryDates,
    defaultOpen: true,
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/trips')}>
        My trips
      </Button>

      <Box
        sx={{
          display: 'grid',
          gap: 6,
          mt: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 400px' },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h2" component="h1">
                {trip.name}
              </Typography>
              <StarButton destination={destination} />
            </Box>

            <Typography color="text.secondary" sx={{ mt: 1, fontSize: 20 }}>
              {placeRegion(destination)} · {formatRange(trip.dates)}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={viewDestination}>
                View destination details
              </Button>
              <Button color="error" onClick={handleDelete}>
                Delete trip
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="h3" sx={{ fontSize: 28 }}>
              Place to stay
            </Typography>
            <TextField
              value={stay ?? trip.accommodation}
              onChange={(e) => setStay(e.target.value)}
              onBlur={saveStay}
              placeholder="Add a hotel, rental or friend's place (optional)"
              fullWidth
              inputProps={{ 'aria-label': 'Place to stay' }}
              sx={{ bgcolor: '#fff', borderRadius: '24px' }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="h3" sx={{ fontSize: 28 }}>
              Itinerary
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'stretch' }}>
              <Box
                component="button"
                type="button"
                onClick={openDialog}
                sx={{
                  width: 160,
                  minHeight: 140,
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  borderRadius: '24px',
                  bgcolor: 'transparent',
                  color: 'primary.main',
                  cursor: 'pointer',
                  font: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <AddIcon fontSize="large" />
                Add itinerary
              </Box>

              {itineraryDates.map((d) => (
                <Box
                  key={d}
                  sx={{
                    minWidth: 220,
                    flex: '1 1 220px',
                    bgcolor: 'primary.main',
                    color: '#fff',
                    borderRadius: '24px',
                    p: 2.5,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, mb: 1 }}>{formatLong(d)}</Typography>
                  {trip.itinerary[d].map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: 'rgba(255,255,255,0.12)',
                        borderRadius: '14px',
                        pl: 1.5,
                        mb: 1,
                      }}
                    >
                      <Typography sx={{ flexGrow: 1, py: 1, fontSize: 15 }}>
                        {item.time ? `${item.time} · ` : ''}
                        {item.title}
                      </Typography>
                      <IconButton
                        aria-label={`Remove ${item.title}`}
                        size="small"
                        onClick={() => removeItineraryItem(trip.id, d, item.id)}
                        sx={{ color: '#fff' }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>

          <OverviewCard name={trip.name} destinationKey={trip.destinationKey} />

          <ExplorePanel
            name={trip.name}
            lat={destination.lat}
            lon={destination.lon}
            destinationKey={trip.destinationKey}
          />
        </Box>

        <WeatherCard lat={destination.lat} lon={destination.lon} calendar={calendar} />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add to itinerary</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 1 }}
          />
          <TextField
            label="Time (optional)"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="What are you doing?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveItem} disabled={!title.trim() || !date}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}