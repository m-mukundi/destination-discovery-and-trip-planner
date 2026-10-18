import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Box, Typography, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OverviewCard from "../components/OverviewCard"; // Wikivoyage overview card
import WeatherCard from "../components/WeatherCard";
import ExplorePanel from "../components/ExplorePanel";
import StarButton from "../components/StarButton";
import { useTrips } from "../context/TripContext";
import {
  placeKey,
  placeName,
  placeRegion,
  readSelectedDestination,
} from "../utils/place";

export default function DestinationPage() {
  const navigate = useNavigate();
  const { getTripForDestination, createTrip, updateTrip } = useTrips();

  const destination = readSelectedDestination();
  const trip = destination ? getTripForDestination(destination) : null;

  // Dates picked before a trip exists are kept here and used when the trip is created.
  const [draftDates, setDraftDates] = useState({ start: null, end: null });
  const [creating, setCreating] = useState(false);
  const [tripError, setTripError] = useState("");

  if (!destination) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/results")}>
          Back to results
        </Button>

        <Typography variant="h4" sx={{ mt: 4 }}>
          No destination selected
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Please go back and select a destination.
        </Typography>
      </Container>
    );
  }

  const name = placeName(destination);
  const location = placeRegion(destination);

  const key = placeKey(destination);

  const handleCreateTrip = async () => {
    const hasDates = draftDates.start;
    setCreating(true);
    setTripError("");
    try {
      const id = await createTrip(destination, { dates: hasDates ? draftDates : null });
      navigate(`/trip/${id}`);
    } catch (error) {
      console.error("Could not create trip:", error);
      setTripError("Could not create the trip. Please try again.");
      setCreating(false);
    }
  };

  const calendar = trip
    ? {
        value: trip.dates,
        onChange: (dates) => updateTrip(trip.id, { dates }),
        markedDates: Object.keys(trip.itinerary),
      }
    : {
        value: draftDates,
        onChange: setDraftDates,
        markedDates: [],
      };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/results")}>
        Back to results
      </Button>

      <Box
        sx={{
          display: "grid",
          gap: 6,
          mt: 2,
          gridTemplateColumns: { xs: "1fr", md: "1fr 400px" },
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Typography variant="h2" component="h1">
              {name}
            </Typography>

            {trip ? (
              <Button variant="outlined" onClick={() => navigate(`/trip/${trip.id}`)}>
                View Trip for This Place
              </Button>
            ) : (
              <Button variant="contained" onClick={handleCreateTrip} disabled={creating}>
                {creating ? "Creating..." : "Create My Trip"}
              </Button>
            )}

            <StarButton destination={destination} />
          </Box>

          {tripError && (
            <Typography color="error" sx={{ mt: 1 }}>
              {tripError}
            </Typography>
          )}

          <Typography color="text.secondary" sx={{ mt: 1, fontSize: 20 }}>
            {location}
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ my: 3, fontSize: 20, maxWidth: 640, lineHeight: 1.6 }}
          >
            {destination.display_name}
          </Typography>

          <OverviewCard name={name} destinationKey={key} />

          <ExplorePanel
            name={name}
            lat={destination.lat}
            lon={destination.lon}
            destinationKey={key}
          />
        </Box>

        <WeatherCard lat={destination.lat} lon={destination.lon} calendar={calendar} />
      </Box>
    </Container>
  );
}