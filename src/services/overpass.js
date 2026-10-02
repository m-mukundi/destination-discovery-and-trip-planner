// Public Overpass servers are often busy, slow or failing, so every query is
// sent to all of them at once and the first good answer wins.
const OVERPASS_URLS = [
	"https://overpass-api.de/api/interpreter",
	"https://maps.mail.ru/osm/tools/overpass/api/interpreter",
	"https://overpass.kumi.systems/api/interpreter",
];
// The query's own [timeout:25] plus time spent queueing on busy servers.
const REQUEST_TIMEOUT_MS = 60000;
const SEARCH_RADIUS_METRES = 10000;
const METRES_PER_DEGREE = 111320;
const CACHE_KEY_PREFIX = "overpassPlaces:";

// Tag filters for each category. The `primary` places are shown when there
// are any; otherwise the wider `fallback` list (when defined) is used.
const CATEGORY_FILTERS = {
	attractions: {
		primary: [{ tourism: "attraction" }],
		fallback: [
			{ tourism: "attraction" },
			{ tourism: "museum" },
			{ tourism: "gallery" },
			{ historic: "archaeological_site" },
			{ historic: "ruins" },
			{ tourism: "zoo" },
			{ leisure: "park" },
			{ tourism: "aquarium" },
			{ leisure: "garden" },
		],
	},
	nature: {
		primary: [
			{ natural: "beach" },
			{ leisure: "nature_reserve" },
			{ natural: "water", water: "lake" },
			{ waterway: "waterfall" },
		],
	},
	food: {
		primary: [{ amenity: "restaurant" }],
		fallback: [
			{ amenity: "restaurant" },
			{ amenity: "fast_food" },
			{ amenity: "cafe" },
			{ amenity: "bar" },
			{ amenity: "nightclub" },
		],
	},
};

// Every distinct filter across all categories, so one request covers them all.
const ALL_FILTERS = [
	...new Map(
		Object.values(CATEGORY_FILTERS)
			.flatMap(({ primary, fallback = [] }) => [...primary, ...fallback])
			.map((filter) => [JSON.stringify(filter), filter])
	).values(),
];

function toTagFilter(filter) {
	return Object.entries(filter)
		.map(([key, value]) => `["${key}"="${value}"]`)
		.join("");
}

// A box reaching SEARCH_RADIUS_METRES from the centre on each side. Overpass
// answers bounding-box searches much faster than `around` (radius) searches.
function toBoundingBox(lat, lon) {
	const latitude = Number(lat);
	const longitude = Number(lon);
	const latDelta = SEARCH_RADIUS_METRES / METRES_PER_DEGREE;
	const lonDelta =
		SEARCH_RADIUS_METRES /
		(METRES_PER_DEGREE * Math.cos((latitude * Math.PI) / 180));

	return [
		latitude - latDelta,
		longitude - lonDelta,
		latitude + latDelta,
		longitude + lonDelta,
	]
		.map((value) => value.toFixed(5))
		.join(",");
}

function buildQuery(lat, lon) {
	const statements = ALL_FILTERS.map(
		(filter) => `  nwr${toTagFilter(filter)}["name"];`
	).join("\n");

	return `[out:json][timeout:25][bbox:${toBoundingBox(lat, lon)}];\n(\n${statements}\n);\nout center tags qt;`;
}

function matchesFilter(tags, filter) {
	return Object.entries(filter).every(([key, value]) => tags[key] === value);
}

// Drops duplicate names and lists places that have a Wikipedia/Wikidata
// entry first, since those tend to be the well-known ones.
function toPlaces(elements) {
	const seen = new Set();
	const places = [];

	for (const element of elements) {
		const name = element.tags.name;

		if (seen.has(name)) {
			continue;
		}

		seen.add(name);
		places.push({
			id: `${element.type}-${element.id}`,
			name,
			lat: element.lat ?? element.center?.lat,
			lon: element.lon ?? element.center?.lon,
			tags: element.tags,
		});
	}

	const isNotable = (place) =>
		place.tags.wikidata || place.tags.wikipedia ? 1 : 0;

	return places.sort((a, b) => isNotable(b) - isNotable(a));
}

function groupByCategory(elements) {
	const named = elements.filter((element) => element.tags?.name);
	const placesMatching = (filters) =>
		toPlaces(
			named.filter((element) =>
				filters.some((filter) => matchesFilter(element.tags, filter))
			)
		);

	return Object.fromEntries(
		Object.entries(CATEGORY_FILTERS).map(([category, { primary, fallback }]) => {
			const places = placesMatching(primary);

			return [
				category,
				places.length > 0 || !fallback ? places : placesMatching(fallback),
			];
		})
	);
}

async function fetchFromServer(url, query, signal) {
	const response = await fetch(url, {
		method: "POST",
		body: new URLSearchParams({ data: query }),
		signal,
	});

	if (!response.ok) {
		throw new Error(`${new URL(url).host} responded ${response.status}`);
	}

	const data = await response.json();
	return data.elements ?? [];
}

async function fetchElements(query, signal) {
	// Cancels the slower servers once one has answered.
	const race = new AbortController();
	const requestSignal = AbortSignal.any(
		[race.signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS), signal].filter(
			Boolean
		)
	);

	try {
		return await Promise.any(
			OVERPASS_URLS.map((url) => fetchFromServer(url, query, requestSignal))
		);
	} catch (error) {
		const reasons = error.errors?.map((e) => e.message).join("; ");
		throw new Error(`All Overpass servers failed: ${reasons}`, {
			cause: error,
		});
	} finally {
		race.abort();
	}
}

function readCache(key) {
	try {
		const cached = sessionStorage.getItem(key);
		return cached ? JSON.parse(cached) : null;
	} catch {
		return null;
	}
}

function writeCache(key, value) {
	try {
		sessionStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Storage full or unavailable: the results just won't be cached.
	}
}

// Returns { attractions: [...], nature: [...], food: [...] } for the area
// around the given coordinates, using a single Overpass request.
export async function fetchNearbyPlaces(lat, lon, { signal } = {}) {
	const cacheKey = `${CACHE_KEY_PREFIX}${lat},${lon}`;
	const cached = readCache(cacheKey);

	if (cached) {
		return cached;
	}

	const elements = await fetchElements(buildQuery(lat, lon), signal);
	const categories = groupByCategory(elements);

	writeCache(cacheKey, categories);
	return categories;
}
