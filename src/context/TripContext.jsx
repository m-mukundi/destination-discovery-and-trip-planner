import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as userData from '../services/userData';
import { placeKey, readSearchContext } from '../utils/place';

// Saved places and trips used to live in localStorage under this key. They
// are stored by the backend now, so the old copy is removed.
const LEGACY_STORAGE_KEY = 'tripPlanner.v1';

const TripContext = createContext(null);

export function TripProvider({ children }) {
  const [saved, setSaved] = useState([]); // destinations, newest first
  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Storage unavailable: nothing to clean up.
    }

    let cancelled = false;

    Promise.all([userData.getSavedPlaces(), userData.getTrips()])
      .then(([savedPlaces, tripList]) => {
        if (cancelled) return;
        setSaved(savedPlaces.map((s) => s.place));
        setTrips(tripList);
        setStatus('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Could not load saved places and trips:', error);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const replaceTrip = useCallback((trip) => {
    setTrips((ts) => ts.map((t) => (t.id === trip.id ? trip : t)));
  }, []);

  // After a failed change, reload so the screen matches what is stored.
  const reloadTrips = useCallback(() => {
    userData
      .getTrips()
      .then(setTrips)
      .catch((error) => console.error('Could not reload trips:', error));
  }, []);

  // ---- Saved places -------------------------------------------------------
  const savedKeys = useMemo(() => new Set(saved.map(placeKey)), [saved]);

  const isSaved = useCallback((d) => savedKeys.has(placeKey(d)), [savedKeys]);

  // The star changes straight away and changes back if the request fails.
  const toggleSaved = useCallback(
    async (d) => {
      const key = placeKey(d);
      const wasSaved = savedKeys.has(key);
      const remove = (list) => list.filter((p) => placeKey(p) !== key);

      setSaved((s) => (wasSaved ? remove(s) : [d, ...remove(s)]));

      try {
        if (wasSaved) {
          await userData.unsavePlace(key);
        } else {
          const { query, results } = readSearchContext(d);
          await userData.savePlace(d, query, results);
        }
      } catch (error) {
        console.error('Could not update saved place:', error);
        setSaved((s) => (wasSaved ? [d, ...remove(s)] : remove(s)));
      }
    },
    [savedKeys]
  );

  // ---- Trips --------------------------------------------------------------
  const getTripForDestination = useCallback(
    (d) => trips.find((t) => t.destinationKey === placeKey(d)) || null,
    [trips]
  );

  const getTripById = useCallback(
    (id) => trips.find((t) => String(t.id) === String(id)) || null,
    [trips]
  );

  // Resolves to the new trip's id (or the existing one: one trip per place).
  const createTrip = useCallback(
    async (destination, { dates = null, accommodation = '' } = {}) => {
      const trip = await userData.createTrip(destination, { dates, accommodation });
      setTrips((ts) => [trip, ...ts.filter((t) => t.id !== trip.id)]);
      return trip.id;
    },
    []
  );

  const updateTrip = useCallback(
    async (id, patch) => {
      setTrips((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      try {
        replaceTrip(await userData.updateTrip(id, patch));
      } catch (error) {
        console.error('Could not update trip:', error);
        reloadTrips();
      }
    },
    [replaceTrip, reloadTrips]
  );

  const deleteTrip = useCallback(async (id) => {
    await userData.deleteTrip(id);
    setTrips((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const addItineraryItem = useCallback(
    async (tripId, date, item) => {
      try {
        replaceTrip(await userData.addItineraryItem(tripId, date, item));
      } catch (error) {
        console.error('Could not add itinerary item:', error);
      }
    },
    [replaceTrip]
  );

  const removeItineraryItem = useCallback(
    async (tripId, date, itemId) => {
      try {
        replaceTrip(await userData.removeItineraryItem(tripId, itemId));
      } catch (error) {
        console.error('Could not remove itinerary item:', error);
      }
    },
    [replaceTrip]
  );

  const value = useMemo(
    () => ({
      status,
      savedPlaces: saved,
      isSaved,
      toggleSaved,
      trips,
      getTripForDestination,
      getTripById,
      createTrip,
      updateTrip,
      deleteTrip,
      addItineraryItem,
      removeItineraryItem,
    }),
    [
      status,
      saved,
      isSaved,
      toggleSaved,
      trips,
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
