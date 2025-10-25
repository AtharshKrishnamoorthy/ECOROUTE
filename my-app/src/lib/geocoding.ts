/**
 * Geocoding and Routing Utilities
 * Uses OpenStreetMap Nominatim for geocoding and OpenRouteService for routing
 */

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface RouteData {
  sourceCoords: [number, number];
  destCoords: [number, number];
  routeCoordinates: [number, number][];
  distance: number; // in meters
  duration: number; // in seconds
}

/**
 * Geocode an address to coordinates using Nominatim
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    console.log(`🔍 Geocoding address: ${address}`);
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'EcoRoute/1.0' // Required by Nominatim
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ Geocoding failed with status: ${response.status}`);
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
      console.log(`✅ Geocoded "${address}" to:`, coords);
      return coords;
    }

    console.warn(`⚠️ No results found for address: ${address}`);
    return null;
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return null;
  }
}

/**
 * Get route between two points using OpenRouteService (free, open-source)
 * Alternative: Can use OSRM or other routing services
 */
export async function getRoute(
  source: Coordinates,
  destination: Coordinates,
  mode: string = 'car'
): Promise<RouteData | null> {
  try {
    // Using OSRM (Open Source Routing Machine) - free, no API key required
    const profile = mode === 'bike' ? 'bike' : mode === 'foot' ? 'foot' : 'car';
    const url = `https://router.project-osrm.org/route/v1/${profile}/${source.lon},${source.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson`;

    console.log(`🗺️ Fetching route (${profile}) from [${source.lat}, ${source.lon}] to [${destination.lat}, ${destination.lon}]`);
    
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`❌ Routing failed with status: ${response.status}`);
      throw new Error(`Routing failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.error('❌ No route found in response:', data);
      throw new Error('No route found');
    }

    const route = data.routes[0];
    const geometry = route.geometry;

    // Convert GeoJSON coordinates [lon, lat] to Leaflet format [lat, lon]
    const routeCoordinates: [number, number][] = geometry.coordinates.map(
      (coord: number[]) => [coord[1], coord[0]]
    );

    console.log(`✅ Route found: ${routeCoordinates.length} points, ${(route.distance/1000).toFixed(2)} km, ${Math.round(route.duration/60)} min`);

    return {
      sourceCoords: [source.lat, source.lon],
      destCoords: [destination.lat, destination.lon],
      routeCoordinates,
      distance: route.distance, // in meters
      duration: route.duration  // in seconds
    };
  } catch (error) {
    console.error('❌ Routing error:', error);
    return null;
  }
}

/**
 * Geocode both addresses and get route in one call
 */
export async function geocodeAndRoute(
  sourceAddress: string,
  destAddress: string,
  mode: string = 'car'
): Promise<RouteData | null> {
  try {
    // Geocode both addresses in parallel
    const [sourceCoords, destCoords] = await Promise.all([
      geocodeAddress(sourceAddress),
      geocodeAddress(destAddress)
    ]);

    if (!sourceCoords || !destCoords) {
      console.error('Failed to geocode addresses');
      return null;
    }

    // Get route
    const routeData = await getRoute(sourceCoords, destCoords, mode);
    return routeData;
  } catch (error) {
    console.error('Error in geocodeAndRoute:', error);
    return null;
  }
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Calculate estimated CO2 savings (simplified)
 * Based on transport mode and distance
 */
export function calculateCO2Savings(
  distance: number, // in meters
  mode: string,
  priority: string
): number {
  const km = distance / 1000;
  
  // Average CO2 per km by mode
  const emissions: Record<string, number> = {
    car: 0.12,        // kg CO2 per km
    bike: 0,
    walk: 0,
    'public transport': 0.05,
    bus: 0.05,
    train: 0.03
  };
  
  const baseEmission = emissions[mode.toLowerCase()] || 0.12;
  const totalEmission = baseEmission * km;
  
  // If eco-friendly priority, assume 25% savings
  if (priority.toLowerCase().includes('eco')) {
    return totalEmission * 0.25;
  }
  
  return totalEmission * 0.15; // 15% savings for other modes
}
