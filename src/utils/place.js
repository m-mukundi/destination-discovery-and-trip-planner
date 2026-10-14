// Helpers for working with Nominatim results.

export const placeKey = (d) =>
  d ? `${d.osm_type ?? 'x'}-${d.osm_id ?? d.place_id}` : '';

export const placeName = (d) => d?.name || d?.display_name || '';

export const placeRegion = (d) =>
  d?.address?.county || d?.address?.state || d?.address?.country || 'Kenya';

// The destination page reads the selected place from sessionStorage.
export const selectDestination = (d) =>
  sessionStorage.setItem('selectedDestination', JSON.stringify(d));

export const readSelectedDestination = () => {
  try {
    const raw = sessionStorage.getItem('selectedDestination');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Could not read selected destination:', error);
    return null;
  }
};