CREATE TABLE destinations (
  id SERIAL PRIMARY KEY,
  place_key VARCHAR(100) NOT NULL UNIQUE,   -- same value the frontend's placeKey() returns
  name TEXT NOT NULL,
  display_name TEXT,
  lat NUMERIC(9,6) NOT NULL,
  lon NUMERIC(9,6) NOT NULL,
  raw JSONB NOT NULL,                       -- full Nominatim object
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  destination_id INT NOT NULL UNIQUE REFERENCES destinations(id),
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  accommodation VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE itinerary_items (
  id SERIAL PRIMARY KEY,
  trip_id INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  item_date DATE NOT NULL,
  item_time TIME,                           -- optional
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE saved_places (
  id SERIAL PRIMARY KEY,
  destination_id INT NOT NULL UNIQUE REFERENCES destinations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_items_trip_date ON itinerary_items(trip_id, item_date, item_time);
