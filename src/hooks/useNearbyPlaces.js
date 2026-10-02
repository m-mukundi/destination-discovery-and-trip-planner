import { useEffect, useState } from "react";
import { fetchNearbyPlaces } from "../services/overpass";

// Returns { status: "loading" | "done" | "error", categories }, where
// categories is { attractions, nature, food } once loaded.
export default function useNearbyPlaces(lat, lon) {
	const [state, setState] = useState({ status: "loading", categories: {} });

	useEffect(() => {
		if (lat == null || lon == null) {
			return;
		}

		const controller = new AbortController();

		fetchNearbyPlaces(lat, lon, { signal: controller.signal })
			.then((categories) => setState({ status: "done", categories }))
			.catch((error) => {
				if (controller.signal.aborted) {
					return;
				}

				console.error("Overpass search failed:", error);
				setState({ status: "error", categories: {} });
			});

		return () => controller.abort();
	}, [lat, lon]);

	return state;
}
