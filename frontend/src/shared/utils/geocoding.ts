/**
 * Reverse Geocodes coordinates (Latitude, Longitude) into a human-readable street address
 * using OpenStreetMap Nominatim API (Free, global, no API key required)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'WasteWise-Municipal-SaaS/1.0',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || !data.address) return null;

    const address = data.address;
    // Build a clean, recognizable Nepali municipal street address
    const street = address.road || address.pedestrian || address.neighbourhood || address.suburb || address.quarter || '';
    const landmark = address.amenity || address.shop || address.building || '';
    const city = address.city || address.town || address.municipality || address.county || '';

    const parts = [landmark, street, city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : (data.display_name?.split(',').slice(0, 3).join(',') || null);
  } catch (err) {
    console.warn('Reverse geocoding failed:', err);
    return null;
  }
}

