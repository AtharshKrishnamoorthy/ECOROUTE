'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

// Import react-leaflet components dynamically to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

interface RouteMapProps {
  source: string;
  destination: string;
  sourceCoords?: [number, number];
  destCoords?: [number, number];
  routeCoordinates?: [number, number][];
  className?: string;
}

// Create a component for map bounds control
// This will be dynamically loaded with the map
const MapBoundsComponent = dynamic(
  () => Promise.resolve(({ sourceCoords, destCoords, routeCoordinates }: {
    sourceCoords?: [number, number];
    destCoords?: [number, number];
    routeCoordinates?: [number, number][];
  }) => {
    const { useMap } = require('react-leaflet');
    const map = useMap();
    
    useEffect(() => {
      if (!map) return;
      
      try {
        const L = require('leaflet');
        
        if (routeCoordinates && routeCoordinates.length > 0) {
          const bounds = L.latLngBounds(routeCoordinates);
          map.fitBounds(bounds, { padding: [50, 50] });
        } else if (sourceCoords && destCoords) {
          const bounds = L.latLngBounds([sourceCoords, destCoords]);
          map.fitBounds(bounds, { padding: [50, 50] });
        } else if (sourceCoords) {
          map.setView(sourceCoords, 13);
        }
      } catch (error) {
        console.error('Error fitting map bounds:', error);
      }
    }, [map, sourceCoords, destCoords, routeCoordinates]);

    return null;
  }),
  { ssr: false }
);

export default function RouteMap({
  source,
  destination,
  sourceCoords,
  destCoords,
  routeCoordinates,
  className = ''
}: RouteMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    
    // Fix for default marker icons in Leaflet (client-side only)
    if (typeof window !== 'undefined') {
      try {
        // Import Leaflet dynamically on client
        require('leaflet/dist/leaflet.css');
        const L = require('leaflet');
        
        // Fix marker icon paths
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    }
    
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  // Default center (if no coordinates provided)
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // New York
  const center = sourceCoords || defaultCenter;

  if (!isClient) {
    return (
      <div className={`relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white/90 z-[1000] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm text-gray-600">Initializing map...</p>
          </div>
        </div>
      )}
      
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Source Marker */}
        {sourceCoords && (
          <Marker position={sourceCoords}>
            <Popup>
              <div className="text-sm">
                <strong className="text-blue-600">Start Point</strong>
                <p className="text-gray-700 mt-1">{source}</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Destination Marker */}
        {destCoords && (
          <Marker position={destCoords}>
            <Popup>
              <div className="text-sm">
                <strong className="text-red-600">Destination</strong>
                <p className="text-gray-700 mt-1">{destination}</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Route Polyline */}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: '#10b981',
              weight: 5,
              opacity: 0.8,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        )}
        
        {/* Auto-fit bounds */}
        <MapBoundsComponent 
          sourceCoords={sourceCoords}
          destCoords={destCoords}
          routeCoordinates={routeCoordinates}
        />
      </MapContainer>
      
      {/* Map Info Overlay */}
      <div className="absolute top-2 left-2 z-[1000]">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 space-y-1">
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-gray-700 font-medium">{source.split(',')[0] || 'Source'}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-gray-700 font-medium">{destination.split(',')[0] || 'Destination'}</span>
          </div>
          {routeCoordinates && routeCoordinates.length > 0 && (
            <div className="flex items-center space-x-2 text-xs pt-1 border-t border-gray-200">
              <Navigation className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-600 font-medium">Route Active</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Eco Badge */}
      {routeCoordinates && routeCoordinates.length > 0 && (
        <div className="absolute top-2 right-2 z-[1000]">
          <div className="bg-emerald-500/95 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-medium">Eco Route</span>
          </div>
        </div>
      )}
      
      {/* No coordinates fallback */}
      {!sourceCoords && !destCoords && (
        <div className="absolute inset-0 bg-black/50 z-[999] flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Route Data</h3>
            <p className="text-sm text-gray-600">
              Enter source and destination addresses to see the route on the map.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
