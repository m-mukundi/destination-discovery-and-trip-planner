import { useEffect, useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import WbCloudyIcon from "@mui/icons-material/WbCloudy";
import GrainIcon from "@mui/icons-material/Grain";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import AirIcon from "@mui/icons-material/Air";
import { getWeather } from "../services/weather";

function describe(code) {
  if (code === 0) return { label: "Clear sky", Icon: WbSunnyIcon };
  if (code <= 2) return { label: "Partly cloudy", Icon: WbCloudyIcon };
  if (code === 3) return { label: "Overcast", Icon: WbCloudyIcon };
  if (code === 45 || code === 48) return { label: "Fog", Icon: WbCloudyIcon };
  if (code >= 51 && code <= 57) return { label: "Drizzle", Icon: GrainIcon };
  if (code >= 61 && code <= 67) return { label: "Rain", Icon: GrainIcon };
  if (code >= 80 && code <= 82) return { label: "Rain showers", Icon: GrainIcon };
  if (code >= 95) return { label: "Thunderstorm", Icon: ThunderstormIcon };
  return { label: "Cloudy", Icon: WbCloudyIcon };
}

function Stat({ icon, label, value }) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        p: 2,
        bgcolor: "#fff",
        borderRadius: "20px",
        color: "primary.main",
      }}
    >
      {icon}
      <Box>
        <Typography color="text.secondary">{label}</Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 20, color: "text.primary" }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export default function WeatherCard({ lat, lon }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (lat == null || lon == null) return;

    let cancelled = false;
    setWeather(null);
    setError(null);

    getWeather(lat, lon)
      .then((data) => !cancelled && setWeather(data))
      .catch((e) => !cancelled && setError(e.message));

    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  const current = weather?.current;
  const units = weather?.current_units;
  const { label, Icon } = describe(current?.weather_code);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2.25,
        p: 3.5,
        bgcolor: "#DCEEEE",
        borderRadius: "32px",
        alignSelf: "start",
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "primary.main",
        }}
      >
        Weather now
      </Typography>

      {error ? (
        <Typography color="error">Could not load weather right now.</Typography>
      ) : !current ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, color: "primary.main" }}>
            <Icon sx={{ fontSize: 64 }} />
            <Typography variant="h2" sx={{ fontSize: 72, lineHeight: 1 }}>
              {Math.round(current.temperature_2m)}
              {units.temperature_2m}
            </Typography>
          </Box>

          <Typography sx={{ fontSize: 22, fontWeight: 500 }}>{label}</Typography>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Stat
              icon={<WaterDropIcon />}
              label="Humidity"
              value={`${current.relative_humidity_2m}${units.relative_humidity_2m}`}
            />
            <Stat
              icon={<AirIcon />}
              label="Wind"
              value={`${Math.round(current.wind_speed_10m)} ${units.wind_speed_10m}`}
            />
          </Box>
        </>
      )}
    </Box>
  );
}