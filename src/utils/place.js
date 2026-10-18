// Helpers for working with Nominatim results.

export const placeKey = (d) =>
  d ? `${d.osm_type ?? 'x'}-${d.osm_id ?? d.place_id}` : '';

export const placeName = (d) => d?.name || d?.display_name || '';

export const placeRegion = (d) =>
  d?.address?.county || d?.address?.state || d?.address?.country || 'Kenya';

// The destination page reads the selected place from sessionStorage.
export const selectDestination = (d) =>
  sessionStorage.setItem('selectedDestination', JSON.stringify(d));

// The search a destination was picked from, if it came from the last search.
// Saving the place sends this along so the other results are stored as
// related places (saving "Mombasa" also stores "Mombasa County").
export const readSearchContext = (d) => {
  try {
    const results = JSON.parse(sessionStorage.getItem('nominatimResults') || '[]');
    const query = sessionStorage.getItem('destinationQuery') || '';
    if (results.some((r) => placeKey(r) === placeKey(d))) {
      return { query, results };
    }
  } catch (error) {
    console.error('Could not read the last search:', error);
  }
  return { query: '', results: [] };
};

export const readSelectedDestination = () => {
  try {
    const raw = sessionStorage.getItem('selectedDestination');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Could not read selected destination:', error);
    return null;
  }
};