import json
import math
import os
import sqlite3
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from datetime import datetime, timezone
from urllib.parse import quote

import requests
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from flask_migrate import Migrate
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from models import Destination, SearchTerm, db, normalize_term, place_key, utc_now
from store import get_current_user, saved_place_keys, stored_destination
from user_routes import create_user_data_blueprint

app = Flask(__name__)

# --------------------------------------------------
# Configuration
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PORT = int(os.getenv("PORT", "5001"))  # 5000 clashes with AirPlay on macOS

# Comma-separated list. Covers Vite (5173) and CRA (3000), on both
# "localhost" and "127.0.0.1", which browsers treat as different origins.
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

CORS(app, resources={r"/api/*": {"origins": FRONTEND_ORIGINS}})


def database_url():
    url = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/trip_planner",
    )
    # Hosting providers usually give postgres:// or postgresql:// URLs;
    # SQLAlchemy needs the driver name as well.
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


# PostgreSQL: saved places, trips and the destinations they refer to.
# The SQLite store below only caches API responses.
app.config["SQLALCHEMY_DATABASE_URI"] = database_url()
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_pre_ping": True,
    # Fail fast when PostgreSQL is down, so searches can fall back to the APIs.
    "connect_args": {"connect_timeout": 3},
}
app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024
db.init_app(app)
Migrate(app, db)

# Nominatim's policy asks for a User-Agent that identifies you with contact info.
CONTACT = os.getenv("APP_CONTACT", "leonnyongesa3@gmail.com")

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": f"DestinationDiscoveryTripPlanner/1.0 ({CONTACT})",
    "Accept": "*/*",  # overpass-api.de answers 406 to Accept: application/json
})

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

# private.coffee and kumi.systems were removed: both return HTTP 500 for every
# request, even from curl. Add working mirrors here if you find any.
OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
]
# Set USE_OVERPASS=0 to skip Overpass and use Nominatim only (faster, simpler,
# but less detailed results).
USE_OVERPASS = os.getenv("USE_OVERPASS", "1") == "1"
OVERPASS_QUERY_TIMEOUT = 6     # seconds the Overpass server may spend
OVERPASS_REQUEST_TIMEOUT = 8   # seconds we wait for each server
OVERPASS_COOLDOWN = 300        # skip a server this long after a 500 error

WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
WIKIVOYAGE_API = "https://en.wikivoyage.org/w/api.php"
WIKIVOYAGE_SUMMARY = "https://en.wikivoyage.org/api/rest_v1/page/summary"

SEARCH_RADIUS_METRES = int(os.getenv("SEARCH_RADIUS_METRES", "5000"))
METRES_PER_DEGREE = 111320
MAX_RESULTS = 100  # per Overpass query

# --------------------------------------------------
# Persistent store (SQLite): survives restarts; None is storable
# --------------------------------------------------

MISS = object()
DB_PATH = os.getenv("CACHE_DB", os.path.join(BASE_DIR, "cache.db"))
db_lock = threading.Lock()


def init_db():
    with closing(sqlite3.connect(DB_PATH, timeout=10)) as conn:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute(
            "CREATE TABLE IF NOT EXISTS store ("
            "key TEXT PRIMARY KEY, data TEXT NOT NULL, "
            "fetched_at REAL NOT NULL, expires_at REAL NOT NULL)"
        )
        conn.commit()


init_db()


def _read_row(key):
    with db_lock, closing(sqlite3.connect(DB_PATH, timeout=10)) as conn:
        return conn.execute(
            "SELECT data, expires_at FROM store WHERE key = ?", (key,)
        ).fetchone()


def cached_get(key):
    """Return fresh stored data, or MISS if absent or expired."""
    row = _read_row(key)
    if row and row[1] > time.time():
        return json.loads(row[0])
    return MISS


def cached_stale(key):
    """Return stored data even if expired, or MISS if never stored."""
    row = _read_row(key)
    return json.loads(row[0]) if row else MISS


def cached_set(key, data, ttl=600):
    now = time.time()
    with db_lock, closing(sqlite3.connect(DB_PATH, timeout=10)) as conn:
        conn.execute(
            "INSERT OR REPLACE INTO store (key, data, fetched_at, expires_at) "
            "VALUES (?, ?, ?, ?)",
            (key, json.dumps(data), now, now + ttl),
        )
        conn.commit()


def cached_load(key, ttl, loader):
    """Return stored value for key, otherwise call loader() and store it.

    If loader() fails and an expired value exists, serve that instead of
    failing. If nothing is stored, the error propagates.
    """
    data = cached_get(key)
    if data is not MISS:
        return data

    try:
        data = loader()
    except UPSTREAM_ERRORS:
        stale = cached_stale(key)
        if stale is MISS:
            raise
        app.logger.warning("Upstream failed, serving stale data for %s", key)
        return stale

    cached_set(key, data, ttl)
    return data


# --------------------------------------------------
# Helpers
# --------------------------------------------------

def get_json(url, *, params=None, data=None, timeout=20):
    """Make an external API request (GET, or POST if data is given)."""
    if data is None:
        response = SESSION.get(url, params=params, timeout=timeout)
    else:
        response = SESSION.post(url, data=data, timeout=timeout)
    response.raise_for_status()
    return response.json()


def valid_coordinates(lat, lon):
    try:
        lat = float(lat)
        lon = float(lon)
    except (TypeError, ValueError):
        return None

    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return None

    return lat, lon


# --------------------------------------------------
# Destinations that are prefetched in the background
# Edit destinations.json (next to app.py) to change the list, e.g.
#   [{"name": "Mombasa", "lat": -4.0435, "lon": 39.6682}]
# --------------------------------------------------

DEFAULT_DESTINATIONS = [
    {"name": "Mombasa", "lat": -4.0435, "lon": 39.6682},
    {"name": "Nairobi", "lat": -1.2921, "lon": 36.8219},
    {"name": "Diani Beach", "lat": -4.2797, "lon": 39.5947},
    {"name": "Lamu", "lat": -2.2717, "lon": 40.9020},
    {"name": "Zanzibar", "lat": -6.1659, "lon": 39.2026},
    {"name": "Paris", "lat": 48.8566, "lon": 2.3522},
    {"name": "Cape Town", "lat": -33.9249, "lon": 18.4241},
]

SNAP_RADIUS_KM = 15       # requests this close to a prefetched city reuse its data
PREFETCH_INTERVAL = int(os.getenv("PREFETCH_INTERVAL", "600"))  # seconds


def load_destinations():
    path = os.path.join(BASE_DIR, "destinations.json")
    if not os.path.exists(path):
        return DEFAULT_DESTINATIONS

    try:
        with open(path, encoding="utf-8") as file:
            items = json.load(file)
        destinations = []
        for item in items:
            coords = valid_coordinates(item.get("lat"), item.get("lon"))
            name = str(item.get("name", "")).strip()
            if coords and name:
                destinations.append(
                    {"name": name, "lat": coords[0], "lon": coords[1]}
                )
        return destinations or DEFAULT_DESTINATIONS
    except (OSError, ValueError, AttributeError):
        app.logger.exception("Could not read destinations.json; using defaults")
        return DEFAULT_DESTINATIONS


DESTINATIONS = load_destinations()


def haversine_km(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat = p2 - p1
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(a))


def snap_to_destination(lat, lon):
    """If (lat, lon) is near a prefetched city, use that city's coordinates
    so the stored data is reused. Otherwise return the input unchanged."""
    best = None
    for dest in DESTINATIONS:
        distance = haversine_km(lat, lon, dest["lat"], dest["lon"])
        if distance <= SNAP_RADIUS_KM and (best is None or distance < best[0]):
            best = (distance, dest)
    if best:
        return best[1]["lat"], best[1]["lon"]
    return lat, lon


# Nominatim allows at most 1 request per second.
_nominatim_lock = threading.Lock()
_nominatim_last = 0.0


def throttle_nominatim():
    global _nominatim_last
    with _nominatim_lock:
        wait = 1.0 - (time.time() - _nominatim_last)
        if wait > 0:
            time.sleep(wait)
        _nominatim_last = time.time()


# Errors that mean "an upstream service failed".
UPSTREAM_ERRORS = (requests.RequestException, RuntimeError, ValueError)


@app.get("/")
def home():
    return jsonify({"message": "Destination Discovery Flask API is running"})


def from_database(load, default, what):
    """Run a database read. If PostgreSQL is unavailable, log it and return
    `default`, so searching and browsing still work from the APIs. After one
    failure, the rest of the request skips the database instead of waiting
    for it again."""
    if g.get("database_down"):
        return default
    try:
        return load()
    except SQLAlchemyError:
        db.session.rollback()
        g.database_down = True
        app.logger.exception("Database unavailable for %s", what)
        return default


def check_database():
    db.session.execute(text("SELECT 1"))
    return "ok"


@app.get("/api/health")
def health():
    database = from_database(check_database, "unavailable", "health")
    return jsonify({
        "status": "ok",
        "database": database,
        "time": datetime.now(timezone.utc).isoformat(),
    })


# --------------------------------------------------
# Destination search: database first, then Nominatim
# GET /api/destinations/search?q=Mombasa
#
# Places already in PostgreSQL come first, using the stored copy. If the
# keyword's full result list was stored when a place was saved, Nominatim is
# not called at all; otherwise it fills in the remaining results.
# Each result is a Nominatim object plus place_key, source ("database" or
# "api") and saved (true if the current user saved it).
# --------------------------------------------------

MAX_SEARCH_RESULTS = 10
DATABASE_NAME_MATCHES = 5


def search_nominatim(query):
    def load():
        throttle_nominatim()
        return get_json(
            NOMINATIM_URL,
            params={
                "q": query,
                "format": "jsonv2",
                "addressdetails": 1,
                "limit": 5,
            },
        )

    return cached_load(f"nominatim:{query.casefold()}", 3600, load)


def escape_like(value):
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def stored_search_results(query):
    """Return (destinations, complete). `complete` means this keyword's whole
    result list is stored, so there is nothing left to fetch."""
    term = SearchTerm.query.filter_by(term=normalize_term(query)).first()
    linked = [result.destination for result in term.results] if term else []

    by_name = (
        Destination.query
        .filter(Destination.name.ilike(f"%{escape_like(query)}%", escape="\\"))
        .order_by(Destination.name)
        .limit(DATABASE_NAME_MATCHES)
        .all()
    )
    return linked + by_name, term is not None


@app.get("/api/destinations/search")
def search_destinations():
    query = request.args.get("q", "").strip()

    if not query:
        return jsonify({"error": "A destination query is required"}), 400

    if len(query) > 200:
        return jsonify({"error": "Search query is too long"}), 400

    stored, complete = from_database(
        lambda: stored_search_results(query), ([], False), "search"
    )
    saved_keys = from_database(
        lambda: saved_place_keys(get_current_user()), set(), "saved places"
    )

    api_results = []
    if not complete:
        try:
            api_results = search_nominatim(query)
        except UPSTREAM_ERRORS:
            app.logger.exception("Nominatim request failed")
            if not stored:
                return jsonify({"error": "Destination search is unavailable"}), 502

    # API results that are already stored use the stored copy and move up
    # with the other database results.
    api_keys = [place_key(result) for result in api_results]
    known = from_database(
        lambda: {
            d.place_key: d
            for d in Destination.query.filter(Destination.place_key.in_(api_keys))
        } if api_keys else {},
        {},
        "search",
    )
    stored += [known[key] for key in api_keys if key in known]

    results = []
    seen = set()

    def add(place, source):
        key = place_key(place)
        if key not in seen:
            seen.add(key)
            results.append({
                **place,
                "place_key": key,
                "source": source,
                "saved": key in saved_keys,
            })

    for destination in stored:
        add(destination.raw, "database")
    for result in api_results:
        add(result, "api")

    return jsonify(results[:MAX_SEARCH_RESULTS])


# --------------------------------------------------
# Weather: Open-Meteo
# GET /api/weather?lat=-4.05&lon=39.67
# --------------------------------------------------

def load_weather(lat, lon):
    def load():
        return get_json(
            WEATHER_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,weather_code,wind_speed_10m",
                "daily": "temperature_2m_max,temperature_2m_min,weather_code",
                "timezone": "auto",
            },
        )

    return cached_load(f"weather:{lat:.4f}:{lon:.4f}", 900, load)


@app.get("/api/weather")
def get_weather():
    coordinates = valid_coordinates(
        request.args.get("lat"), request.args.get("lon")
    )

    if coordinates is None:
        return jsonify({
            "error": "Valid lat and lon coordinates are required"
        }), 400

    try:
        return jsonify(load_weather(*snap_to_destination(*coordinates)))
    except UPSTREAM_ERRORS:
        app.logger.exception("Weather request failed")
        return jsonify({"error": "Weather data is unavailable"}), 502


# --------------------------------------------------
# Wikivoyage destination overview
# GET /api/destinations/overview?name=Mombasa
# Returns the overview object, or null if nothing was found.
# --------------------------------------------------

def fetch_wikivoyage_summary(title):
    url = f"{WIKIVOYAGE_SUMMARY}/{quote(title, safe='')}"
    response = SESSION.get(url, timeout=15)

    if response.status_code == 404:
        return None

    response.raise_for_status()
    return response.json()


def load_overview(name):
    def load():
        summary = fetch_wikivoyage_summary(name)

        if not summary:
            search_data = get_json(
                WIKIVOYAGE_API,
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": name,
                    "srlimit": 1,
                    "format": "json",
                },
            )
            matches = search_data.get("query", {}).get("search", [])
            if matches:
                summary = fetch_wikivoyage_summary(matches[0]["title"])

        if not summary or not summary.get("extract"):
            return None

        return {
            "title": summary.get("title"),
            "extract": summary.get("extract"),
            "url": (
                summary.get("content_urls", {})
                .get("desktop", {})
                .get("page")
            ),
        }

    return cached_load(f"wikivoyage:{name.casefold()}", 86400, load)


def save_details(destination, **fields):
    """Store fetched details on a destination. A failed write is logged, not
    raised: the caller already has the data to return."""
    try:
        for field, value in fields.items():
            setattr(destination, field, value)
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        app.logger.exception("Could not store details for %s", destination.place_key)


def stored_overview(destination):
    """Overview of a stored destination: from the database, or fetched once
    and stored. None (no Wikivoyage page) is stored too."""
    if destination.overview_fetched_at is not None:
        return destination.overview

    overview = load_overview(destination.name)
    save_details(destination, overview=overview, overview_fetched_at=utc_now())
    return overview


# GET /api/destinations/overview?name=Mombasa&key=relation-123
# `key` (a place_key) is optional: when that place is stored, its overview
# comes from the database instead of Wikivoyage.
@app.get("/api/destinations/overview")
def destination_overview():
    name = request.args.get("name", "").strip()
    key = request.args.get("key", "").strip()

    if not name:
        return jsonify({"error": "A destination name is required"}), 400

    if len(name) > 200:
        return jsonify({"error": "Destination name is too long"}), 400

    destination = from_database(lambda: stored_destination(key), None, "overview")

    try:
        if destination is not None:
            return jsonify(stored_overview(destination))
        return jsonify(load_overview(name))
    except UPSTREAM_ERRORS:
        app.logger.exception("Wikivoyage request failed")
        return jsonify({"error": "Destination overview is unavailable"}), 502


# --------------------------------------------------
# Nearby places: OpenStreetMap Overpass
# GET /api/places/nearby?lat=-4.05&lon=39.67
#
# Returns { attractions: [...], nature: [...], food: [...] }
#   - a list (possibly empty) means the category loaded
#   - null means that category failed to load
# One small Overpass query is made per category, so a busy public server
# is less likely to reject it, and one failure doesn't lose everything.
# --------------------------------------------------

CATEGORY_FILTERS = {
    "attractions": {
        "primary": [{"tourism": "attraction"}],
        "fallback": [
            {"tourism": "museum"},
            {"tourism": "gallery"},
            {"historic": "archaeological_site"},
            {"historic": "ruins"},
            {"tourism": "zoo"},
            {"leisure": "park"},
            {"tourism": "aquarium"},
            {"leisure": "garden"},
        ],
    },
    "nature": {
        "primary": [
            {"natural": "beach"},
            {"leisure": "nature_reserve"},
            {"natural": "water", "water": "lake"},
            {"waterway": "waterfall"},
        ],
    },
    "food": {
        "primary": [{"amenity": "restaurant"}],
        "fallback": [
            {"amenity": "fast_food"},
            {"amenity": "cafe"},
            {"amenity": "bar"},
            {"amenity": "nightclub"},
        ],
    },
}


def tag_filter(tags):
    return "".join(f'["{key}"="{value}"]' for key, value in tags.items())


def build_overpass_query(lat, lon, filters):
    lat_delta = SEARCH_RADIUS_METRES / METRES_PER_DEGREE
    cos_lat = max(abs(math.cos(math.radians(lat))), 0.01)
    lon_delta = SEARCH_RADIUS_METRES / (METRES_PER_DEGREE * cos_lat)

    bbox = (
        f"({lat - lat_delta:.5f},{lon - lon_delta:.5f},"
        f"{lat + lat_delta:.5f},{lon + lon_delta:.5f})"
    )

    statements = "\n".join(
        f'  nwr{tag_filter(item)}["name"]{bbox};'
        for item in filters
    )

    return (
        f"[out:json][timeout:{OVERPASS_QUERY_TIMEOUT}];\n"
        "(\n"
        f"{statements}\n"
        ");\n"
        f"out center {MAX_RESULTS} tags;"
    )


_overpass_down_until = {}
_overpass_lock = threading.Lock()


def overpass_candidates():
    """Servers that are not in cooldown (may be empty)."""
    now = time.time()
    with _overpass_lock:
        return [u for u in OVERPASS_URLS if _overpass_down_until.get(u, 0) <= now]


def mark_overpass(url, down_for=0):
    with _overpass_lock:
        if down_for:
            _overpass_down_until[url] = time.time() + down_for
        else:
            _overpass_down_until.pop(url, None)


def fetch_overpass_elements(query):
    errors = []

    candidates = overpass_candidates()
    if not candidates:
        # Every server failed recently: skip straight to the fallback.
        raise RuntimeError("All Overpass servers are cooling down")

    for url in candidates:
        try:
            response = SESSION.post(
                url,
                data={"data": query},
                timeout=OVERPASS_REQUEST_TIMEOUT,
            )
            if not response.ok:
                body = response.text[:120].replace("\n", " ")
                # A bare 500 repeats on every request, so skip that server
                # for a while instead of paying for it each time.
                mark_overpass(
                    url, OVERPASS_COOLDOWN if response.status_code == 500 else 60
                )
                raise RuntimeError(f"HTTP {response.status_code}: {body}")
            mark_overpass(url)
            return response.json().get("elements", [])
        except requests.Timeout as error:
            mark_overpass(url, 60)
            errors.append(f"{url}: timed out")
            app.logger.warning("Overpass server timed out: %s", url)
        except (requests.RequestException, ValueError, RuntimeError) as error:
            errors.append(f"{url}: {error}")
            app.logger.warning("Overpass server failed: %s - %s", url, error)

    raise RuntimeError("All Overpass servers failed: " + "; ".join(errors))


def places_from_elements(elements):
    places = []
    seen = set()

    for element in elements:
        tags = element.get("tags", {})
        name = tags.get("name")

        if not name:
            continue

        center = element.get("center", {})
        lat = element.get("lat", center.get("lat"))
        lon = element.get("lon", center.get("lon"))

        # Use element identity rather than name so distinct places that
        # share a name are not discarded.
        element_id = f"{element.get('type')}-{element.get('id')}"
        if element_id in seen:
            continue
        seen.add(element_id)

        places.append({
            "id": element_id,
            "name": name,
            "lat": lat,
            "lon": lon,
            "tags": tags,
        })

    # Places with a Wikipedia/Wikidata link are usually the notable ones.
    places.sort(
        key=lambda place: not bool(
            place["tags"].get("wikidata") or place["tags"].get("wikipedia")
        )
    )

    return places


def matching_places(named_elements, filters):
    found = [
        element for element in named_elements
        if any(
            all(element["tags"].get(k) == v for k, v in filt.items())
            for filt in filters
        )
    ]
    return places_from_elements(found)


# Fallback when every Overpass server is down: Nominatim (reliable, but
# less detailed). Searches each term inside the same bounding box.
FALLBACK_TERMS = {
    "attractions": ["tourist attraction", "museum"],
    "nature": ["beach", "nature reserve"],
    "food": ["restaurant", "cafe"],
}


def nominatim_places(lat, lon, category):
    lat_delta = SEARCH_RADIUS_METRES / METRES_PER_DEGREE
    cos_lat = max(abs(math.cos(math.radians(lat))), 0.01)
    lon_delta = SEARCH_RADIUS_METRES / (METRES_PER_DEGREE * cos_lat)
    # Nominatim viewbox order: left(lon), top(lat), right(lon), bottom(lat)
    viewbox = (
        f"{lon - lon_delta:.5f},{lat + lat_delta:.5f},"
        f"{lon + lon_delta:.5f},{lat - lat_delta:.5f}"
    )

    places = []
    seen = set()

    for term in FALLBACK_TERMS[category]:
        throttle_nominatim()
        results = get_json(
            NOMINATIM_URL,
            params={
                "q": term,
                "format": "jsonv2",
                "viewbox": viewbox,
                "bounded": 1,
                "limit": 20,
                "extratags": 1,
            },
        )

        for item in results:
            place_id = f"{item.get('osm_type')}-{item.get('osm_id')}"
            if place_id in seen:
                continue

            name = item.get("name") or item.get("display_name", "").split(",")[0]
            if not name:
                continue
            seen.add(place_id)

            tags = {
                **(item.get("extratags") or {}),
                item.get("category", "place"): item.get("type"),
                "name": name,
            }
            places.append({
                "id": place_id,
                "name": name,
                "lat": float(item["lat"]),
                "lon": float(item["lon"]),
                "tags": tags,
            })

    places.sort(
        key=lambda p: not bool(p["tags"].get("wikidata") or p["tags"].get("wikipedia"))
    )
    return places


def load_category(lat, lon, category, upgrade=False):
    """upgrade=True (background prefetcher only): retry Overpass even when a
    fresh Nominatim fallback is stored, to replace it with better data."""
    config = CATEGORY_FILTERS[category]
    suffix = f"{category}:{lat:.4f}:{lon:.4f}"

    def load():
        # Small primary query first; the fallback runs only if it finds nothing.
        for filters in (config["primary"], config.get("fallback")):
            if not filters:
                continue
            elements = fetch_overpass_elements(
                build_overpass_query(lat, lon, filters)
            )
            named = [e for e in elements if e.get("tags", {}).get("name")]
            places = matching_places(named, filters)
            if places:
                return places
        return []

    overpass_key = f"overpass:{suffix}"
    fallback_key = f"nominatim-places:{suffix}"

    # 1. Good data already stored: return it immediately.
    data = cached_get(overpass_key)
    if data is not MISS:
        return data

    # 2. Fresh fallback stored: serve it right away instead of waiting on
    #    Overpass during a user request. The prefetcher upgrades it later.
    if not upgrade:
        data = cached_get(fallback_key)
        if data is not MISS:
            return data

    # 3. Nothing usable stored: try Overpass, then fall back to Nominatim.
    try:
        if not USE_OVERPASS:
            raise RuntimeError("Overpass disabled")
        return cached_load(overpass_key, 21600, load)
    except UPSTREAM_ERRORS:
        app.logger.warning("Overpass unavailable, using Nominatim for %s", category)
        return cached_load(
            fallback_key,
            3600,
            lambda: nominatim_places(lat, lon, category),
        )


def load_places(lat, lon, upgrade=False):
    """Return {category: [places]}; a category that failed is None."""

    def safe_load(category):
        try:
            return load_category(lat, lon, category, upgrade)
        except UPSTREAM_ERRORS:
            app.logger.exception("Places category failed: %s", category)
            return None

    categories = list(CATEGORY_FILTERS)

    # One worker per category, so the slow ones overlap.
    with ThreadPoolExecutor(max_workers=3) as pool:
        loaded = list(pool.map(safe_load, categories))

    result = dict(zip(categories, loaded))

    if all(value is None for value in result.values()):
        raise RuntimeError("All place categories failed")

    return result


def stored_nearby(destination):
    """Nearby places of a stored destination: from the database, or fetched
    and stored. Results with a failed category are returned but not stored,
    so they are fetched again next time."""
    if destination.nearby_fetched_at is not None:
        return destination.nearby

    places = load_places(
        *snap_to_destination(float(destination.lat), float(destination.lon))
    )
    if all(value is not None for value in places.values()):
        save_details(destination, nearby=places, nearby_fetched_at=utc_now())
    return places


# `key` (a place_key) is optional: when that place is stored, its nearby
# places come from the database instead of Overpass.
@app.get("/api/places/nearby")
def nearby_places():
    coordinates = valid_coordinates(
        request.args.get("lat"), request.args.get("lon")
    )

    if coordinates is None:
        return jsonify({
            "error": "Valid lat and lon coordinates are required"
        }), 400

    key = request.args.get("key", "").strip()
    destination = from_database(lambda: stored_destination(key), None, "nearby places")

    try:
        if destination is not None:
            return jsonify(stored_nearby(destination))
        return jsonify(load_places(*snap_to_destination(*coordinates)))
    except UPSTREAM_ERRORS:
        return jsonify({"error": "Nearby places are unavailable"}), 502


# --------------------------------------------------
# Prefetch: weather + overview + places in ONE request, run in parallel.
# GET /api/destinations/prefetch?lat=-4.05&lon=39.67&name=Mombasa
# Returns { weather, overview, places, errors: { section: message } }
# A failing section does not break the others.
# --------------------------------------------------

@app.get("/api/destinations/prefetch")
def prefetch_destination():
    coordinates = valid_coordinates(
        request.args.get("lat"), request.args.get("lon")
    )

    if coordinates is None:
        return jsonify({
            "error": "Valid lat and lon coordinates are required"
        }), 400

    lat, lon = snap_to_destination(*coordinates)
    name = request.args.get("name", "").strip()[:200]

    tasks = {
        "weather": lambda: load_weather(lat, lon),
        "places": lambda: load_places(lat, lon),
    }
    if name:
        tasks["overview"] = lambda: load_overview(name)

    results = {}
    errors = {}

    with ThreadPoolExecutor(max_workers=len(tasks)) as pool:
        futures = {key: pool.submit(task) for key, task in tasks.items()}

    for key, future in futures.items():
        try:
            results[key] = future.result()
        except UPSTREAM_ERRORS:
            app.logger.exception("Prefetch section failed: %s", key)
            errors[key] = f"{key} is unavailable"

    return jsonify({**results, "errors": errors})


# --------------------------------------------------
# Background prefetching
# A background thread keeps overview, places and weather for every
# destination in DESTINATIONS stored in cache.db. The load_* functions only
# call the upstream APIs when the stored copy has expired, so most cycles
# do no network work at all.
# --------------------------------------------------

# Last error per (destination, step); shown by /api/prefetch/status.
prefetch_errors = {}
# Timestamps of the last finished passes; shown by /api/prefetch/status.
prefetch_state = {}


def run_prefetch_step(name, label, step):
    """Run one prefetch step; record the error instead of crashing the thread."""
    try:
        step()
        prefetch_errors.pop((name, label), None)
    except Exception as error:  # keep the background thread alive no matter what
        prefetch_errors[(name, label)] = f"{type(error).__name__}: {str(error)[:200]}"
        app.logger.warning("Prefetch %s failed for %s: %s", label, name, error)


def prefetch_destination_data(dest):
    name, lat, lon = dest["name"], dest["lat"], dest["lon"]
    run_prefetch_step(name, "overview", lambda: load_overview(name))
    run_prefetch_step(name, "places", lambda: load_places(lat, lon, upgrade=True))


def prefetch_loop():
    time.sleep(2)  # let the server finish starting
    while True:
        started = time.time()
        for dest in DESTINATIONS:
            prefetch_destination_data(dest)
            time.sleep(1)
        prefetch_state["cycle_finished"] = time.time()
        app.logger.info(
            "Prefetch cycle done for %d destinations in %.0fs",
            len(DESTINATIONS), time.time() - started,
        )
        time.sleep(PREFETCH_INTERVAL)


def weather_loop():
    """Weather expires after 15 minutes and loads in about a second, so it
    gets its own quick loop instead of waiting behind slow places lookups."""
    time.sleep(2)
    while True:
        for dest in DESTINATIONS:
            run_prefetch_step(
                dest["name"], "weather",
                lambda d=dest: load_weather(d["lat"], d["lon"]),
            )
        prefetch_state["weather_pass_finished"] = time.time()
        time.sleep(min(PREFETCH_INTERVAL, 600))


def start_prefetcher():
    for target, name in ((prefetch_loop, "prefetcher"), (weather_loop, "weather-prefetcher")):
        threading.Thread(target=target, name=name, daemon=True).start()
    app.logger.info("Background prefetcher started (%d destinations)", len(DESTINATIONS))


@app.get("/api/prefetch/status")
def prefetch_status():
    """Shows which prefetched destinations currently have stored data."""
    items = []
    for dest in DESTINATIONS:
        name, lat, lon = dest["name"], dest["lat"], dest["lon"]
        suffix = f"{lat:.4f}:{lon:.4f}"

        def has(key):
            return cached_get(key) is not MISS

        items.append({
            "name": name,
            "overview": has(f"wikivoyage:{name.casefold()}"),
            "weather": has(f"weather:{suffix}"),
            "places": {
                category: has(f"overpass:{category}:{suffix}")
                or has(f"nominatim-places:{category}:{suffix}")
                for category in CATEGORY_FILTERS
            },
            "errors": {
                label: message
                for (dest_name, label), message in prefetch_errors.items()
                if dest_name == name
            },
        })
    def iso(key):
        value = prefetch_state.get(key)
        return datetime.fromtimestamp(value, timezone.utc).isoformat() if value else None

    return jsonify({
        "prefetcher": {
            "threads_running": sorted(
                t.name for t in threading.enumerate()
                if t.name in ("prefetcher", "weather-prefetcher")
            ),
            "weather_pass_finished": iso("weather_pass_finished"),
            "cycle_finished": iso("cycle_finished"),
        },
        "destinations": items,
    })


# --------------------------------------------------
# Saved places and trips (PostgreSQL), see user_routes.py
# --------------------------------------------------

def fetch_details_in_background(destination_id):
    """Store a destination's overview and nearby places right after it is
    saved, so opening it later needs no API calls. Weather is always live,
    so it is not stored."""

    def run():
        with app.app_context():
            destination = db.session.get(Destination, destination_id)
            if destination is None:
                return
            for label, step in (
                ("overview", stored_overview),
                ("nearby places", stored_nearby),
            ):
                try:
                    step(destination)
                except UPSTREAM_ERRORS as error:
                    app.logger.warning(
                        "Could not fetch %s for %s: %s",
                        label, destination.place_key, error,
                    )

    threading.Thread(
        target=run, name=f"details-{destination_id}", daemon=True
    ).start()


app.register_blueprint(
    create_user_data_blueprint(on_destination_stored=fetch_details_in_background)
)


if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "1") == "1"

    # In debug mode Flask runs this file twice (reloader); start the
    # background thread only in the process that actually serves requests.
    if os.getenv("PREFETCH", "1") == "1" and (
        not debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true"
    ):
        start_prefetcher()

    app.run(host="127.0.0.1", port=PORT, debug=debug)