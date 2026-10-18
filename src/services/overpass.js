const CACHE_KEY_PREFIX = "overpassPlaces:";
const CATEGORIES = ["attractions", "nature", "food"];
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 3000;

// Wait for `ms`, but stop early (and reject) if the request is cancelled.
function wait(ms, signal) {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}
		const timer = setTimeout(resolve, ms);
		signal?.addEventListener(
			"abort",
			() => {
				clearTimeout(timer);
				reject(new DOMException("Aborted", "AbortError"));
			},
			{ once: true }
		);
	});
}

// `key` (the place's key) lets the backend answer from the database for
// stored places.
export async function fetchNearbyPlaces(lat, lon, { signal, key } = {}) {
	const cacheKey = `${CACHE_KEY_PREFIX}${lat},${lon}`;

	try {
		const cached = sessionStorage.getItem(cacheKey);
		if (cached) {
			return JSON.parse(cached);
		}
	} catch {
		// Continue if session storage is unavailable.
	}

	const params = new URLSearchParams({
		lat: String(lat),
		lon: String(lon),
	});
	if (key) {
		params.set("key", key);
	}

	// The backend answers 502 when every data source failed for this lookup.
	// That is usually temporary, so retry a couple of times before giving up.
	let response;
	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		response = await fetch(`/api/places/nearby?${params.toString()}`, {
			signal,
		});

		if (response.status !== 502) break;
		if (attempt < MAX_ATTEMPTS) {
			await wait(RETRY_DELAY_MS, signal);
		}
	}

	if (!response.ok) {
		const details = await response.text();
		throw new Error(
			`Nearby places request failed (${response.status}): ${details}`
		);
	}

	const data = await response.json();

	// Each category is an array (loaded, possibly empty) or null (failed).
	const categories = {};
	for (const name of CATEGORIES) {
		const value = data?.[name];
		if (value !== null && !Array.isArray(value)) {
			throw new Error("The backend returned an unexpected places format.");
		}
		categories[name] = value;
	}

	// Only cache complete results, so failed categories get retried next time.
	const complete = CATEGORIES.every((name) => categories[name] !== null);
	if (complete) {
		try {
			sessionStorage.setItem(cacheKey, JSON.stringify(categories));
		} catch {
			// Results can still be displayed without caching.
		}
	}

	return categories;
}