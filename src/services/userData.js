import { apiRequest } from './api';

// Saved places and trips, stored in PostgreSQL by the backend.

export const getSavedPlaces = () => apiRequest('/saved-places');

// `query` and `results` describe the search the place was picked from; the
// other results are stored as related places.
export const savePlace = (place, query, results) =>
  apiRequest('/saved-places', { method: 'POST', body: { place, query, results } });

export const unsavePlace = (key) =>
  apiRequest(`/saved-places/${encodeURIComponent(key)}`, { method: 'DELETE' });

export const getTrips = () => apiRequest('/trips');

export const createTrip = (destination, { dates, accommodation }) =>
  apiRequest('/trips', { method: 'POST', body: { destination, dates, accommodation } });

export const updateTrip = (id, patch) =>
  apiRequest(`/trips/${id}`, { method: 'PATCH', body: patch });

export const deleteTrip = (id) => apiRequest(`/trips/${id}`, { method: 'DELETE' });

export const addItineraryItem = (tripId, date, item) =>
  apiRequest(`/trips/${tripId}/items`, { method: 'POST', body: { date, ...item } });

export const removeItineraryItem = (tripId, itemId) =>
  apiRequest(`/trips/${tripId}/items/${itemId}`, { method: 'DELETE' });
