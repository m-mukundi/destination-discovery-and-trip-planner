import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { placeKey, placeName } from '../utils/place';

const STORAGE_KEY = 'tripPlanner.v1';

const TripContext = createContext(null);

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { saved: parsed.saved || {}, trips: parsed.trips || [] };
    }
  } catch (error) {
    console.error('Could not read saved trips:', error);
  }
  return { saved: {}, trips: [] };
}

const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function TripProvider({ children }) {
  const [state, setState] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Could not store trips:', error);
    }
  }, [state]);

  // ---- Saved places -------------------------------------------------------
  const isSaved = useCallback((d) => !!state.saved[placeKey(d)], [state.saved]);

  const toggleSaved = useCallback((d) => {
    setState((s) => {
      const key = placeKey(d);
      const saved = { ...s.saved };
      if (saved[key]) delete saved[key];
      else saved[key] = d;
      return { ...s, saved };
    });
  }, []);

  const savedPlaces = useMemo(() => Object.values(state.saved), [state.saved]);

  // ---- Trips --------------------------------------------------------------
  const getTripForDestination = useCallback(
    (d) => state.trips.find((t) => t.destinationKey === placeKey(d)) || null,
    [state.trips]
  );

  const getTripById = useCallback(
    (id) => state.trips.find((t) => t.id === id) || null,
    [state.trips]
  );

  // Returns the new trip's id (or the existing one, so a place never gets two trips).
  const createTrip = useCallback(
    (destination, { dates = null, accommodation = '' } = {}) => {
      const existing = state.trips.find(
        (t) => t.destinationKey === placeKey(destination)
      );
      if (existing) return existing.id;

      const id = newId();
      const trip = {
        id,
        name: placeName(destination),
        destinationKey: placeKey(destination),
        destination,
        dates: dates || { start: null, end: null },
        accommodation,
        itinerary: {},
      };
      setState((s) => ({ ...s, trips: [trip, ...s.trips] }));
      return id;
    },
    [state.trips]
  );

  const updateTrip = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      trips: s.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const deleteTrip = useCallback((id) => {
    setState((s) => ({ ...s, trips: s.trips.filter((t) => t.id !== id) }));
  }, []);

  const addItineraryItem = useCallback((tripId, date, item) => {
    setState((s) => ({
      ...s,
      trips: s.trips.map((t) => {
        if (t.id !== tripId) return t;
        const day = t.itinerary[date] || [];
        const next = [...day, { id: newId(), ...item }].sort((a, b) =>
          (a.time || '99:99').localeCompare(b.time || '99:99')
        );
        return { ...t, itinerary: { ...t.itinerary, [date]: next } };
      }),
    }));
  }, []);

  const removeItineraryItem = useCallback((tripId, date, itemId) => {
    setState((s) => ({
      ...s,
      trips: s.trips.map((t) => {
        if (t.id !== tripId) return t;
        const itinerary = { ...t.itinerary };
        const next = (itinerary[date] || []).filter((i) => i.id !== itemId);
        if (next.length) itinerary[date] = next;
        else delete itinerary[date];
        return { ...t, itinerary };
      }),
    }));
  }, []);

  const value = useMemo(
    () => ({
      savedPlaces,
      isSaved,
      toggleSaved,
      trips: state.trips,
      getTripForDestination,
      getTripById,
      createTrip,
      updateTrip,
      deleteTrip,
      addItineraryItem,
      removeItineraryItem,
    }),
    [
      savedPlaces,
      isSaved,
      toggleSaved,
      state.trips,
      getTripForDestination,
      getTripById,
      createTrip,
      updateTrip,
      deleteTrip,
      addItineraryItem,
      removeItineraryItem,
    ]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrips() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrips must be used inside <TripProvider>');
  return ctx;
}