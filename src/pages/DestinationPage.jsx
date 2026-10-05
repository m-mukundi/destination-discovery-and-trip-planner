import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AttractionsIcon from "@mui/icons-material/Attractions";
import ParkIcon from "@mui/icons-material/Park";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import useNearbyPlaces from "../hooks/useNearbyPlaces";
import OverviewCard from "../components/OverviewCard"; // Wikivoyage overview card
import WeatherCard from "../components/WeatherCard";

const HINT_PLACE_COUNT = 3;

const explore = [
  { key: "attractions", label: "Attractions", icon: <AttractionsIcon /> },
  { key: "nature", label: "Nature", icon: <ParkIcon /> },
  { key: "food", label: "Food & Drinks", icon: <RestaurantIcon /> },
];

function getHint(status, places = []) {
  if (status === "loading") return "Finding places nearby...";
  if (status === "error") return "Couldn't load places right now";
  if (places.length === 0) return "Nothing found nearby";

  return places
    .slice(0, HINT_PLACE_COUNT)
    .map((place) => place.name)
    .join(", ");
}

export default function DestinationPage() {
  const navigate = useNavigate();

  const storedDestination = sessionStorage.getItem("selectedDestination");

  let destination = null;

  try {
    destination = storedDestination ? JSON.parse(storedDestination) : null;
  } catch (error) {
    console.error("Could not read selected destination:", error);
  }

  const nearby = useNearbyPlaces(destination?.lat, destination?.lon);

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

  const name = destination.name || destination.display_name;
  const location =
    destination.address?.county ||
    destination.address?.state ||
    destination.address?.country ||
    "Kenya";

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
          <Typography variant="h2" component="h1">
            {name}
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1, fontSize: 20 }}>
            {location}
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ my: 3, fontSize: 20, maxWidth: 640, lineHeight: 1.6 }}
          >
            {destination.display_name}
          </Typography>

          <OverviewCard name={name} />

          <Box
            sx={{
              bgcolor: "primary.main",
              color: "#fff",
              p: 4,
              borderRadius: "32px",
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
                    bgcolor: "rgba(255,255,255,0.1)",
                    borderRadius: "20px",
                    mb: 1.5,
                    py: 2,
                  }}
                >
                  <ListItemIcon sx={{ color: "#fff" }}>{item.icon}</ListItemIcon>

                  <ListItemText
                    primary={item.label}
                    secondary={getHint(nearby.status, nearby.categories[item.key])}
                    sx={{
                      "& .MuiListItemText-secondary": { color: "#BFE0E0" },
                    }}
                  />

                  <ChevronRightIcon />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Box>

        <WeatherCard lat={destination.lat} lon={destination.lon} />
      </Box>
    </Container>
  );
}