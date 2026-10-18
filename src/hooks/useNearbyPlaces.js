import { useEffect, useState } from "react";
import { fetchNearbyPlaces } from "../services/overpass";

export default function useNearbyPlaces(lat, lon, key) {
  const [state, setState] = useState({
    status: "loading",
    categories: {},
  });

  useEffect(() => {
    if (lat == null || lon == null) {
      setState({ status: "error", categories: {} });
      return;
    }

    const controller = new AbortController();
    let active = true;

    setState({ status: "loading", categories: {} });

    fetchNearbyPlaces(lat, lon, { signal: controller.signal, key })
      .then((categories) => {
        if (active) {
          setState({ status: "done", categories });
        }
      })
      .catch((error) => {
        if (active && error.name !== "AbortError") {
          console.error("Nearby places request failed:", error);
          setState({ status: "error", categories: {} });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [lat, lon, key]);

  return state;
}
