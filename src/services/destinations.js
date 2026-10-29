import { apiRequest } from './api';

// Places already in the database come first; the backend fills in the rest
// from Nominatim. Each result is a Nominatim object plus `place_key`,
// `source` ("database" or "api") and `saved`.
export const searchDestinations = (query) =>
  apiRequest(`/destinations/search?${new URLSearchParams({ q: query })}`);

/**
 * Short Wikivoyage overview: { title, extract, url }, or null if there is no page.
 * Pass the place's key so a stored place is answered from the database.
 */
export function getDestinationOverview(name, key) {
  const params = new URLSearchParams({ name });
  if (key) params.set('key', key);
  return apiRequest(`/destinations/overview?${params}`);
}                
