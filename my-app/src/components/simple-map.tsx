'use client';

import { useEffect, useRef } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface SimpleMapProps {
  source: string;
  destination: string;
  className?: string;
}

export default function SimpleMap({ source, destination, className = '' }: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  // For now, we'll create a simple visual representation
  // In a real implementation, you'd integrate with Google Maps, Mapbox, or OpenStreetMap
  
  useEffect(() => {
    // Simulate map loading
    if (mapRef.current) {
      mapRef.current.style.backgroundImage = `
        linear-gradient(135deg, 
          #10b981 0%, 
          #059669 25%, 
          #047857 50%, 
          #065f46 75%, 
          #064e3b 100%
        )
      `;
    }
  }, [source, destination]);

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapRef}
        className="w-full h-full relative"
        style={{
          backgroundImage: `
            linear-gradient(135deg, 
              #10b981 0%, 
              #059669 25%, 
              #047857 50%, 
              #065f46 75%, 
              #064e3b 100%
            )
          `,
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite'
        }}
      >
        {/* Route Path Visualization */}
        <div className="absolute inset-4 flex items-center justify-between">
          {/* Source Marker */}
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <MapPin className="w-3 h-3 text-white" />
            </div>
            <div className="mt-2 px-2 py-1 bg-white/90 rounded text-xs font-medium text-gray-800 max-w-24 text-center truncate">
              {source.split(',')[0]}
            </div>
          </div>

          {/* Route Line */}
          <div className="flex-1 mx-4 relative">
            <div className="h-0.5 bg-white/60 relative">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Navigation className="w-4 h-4 text-white animate-pulse" />
              </div>
              {/* Animated dots */}
              <div className="absolute top-1/2 left-0 w-2 h-2 bg-white rounded-full transform -translate-y-1/2 animate-ping" />
              <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-white/80 rounded-full transform -translate-y-1/2 animate-pulse" style={{animationDelay: '0.5s'}} />
              <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white/80 rounded-full transform -translate-y-1/2 animate-pulse" style={{animationDelay: '1s'}} />
              <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-white/80 rounded-full transform -translate-y-1/2 animate-pulse" style={{animationDelay: '1.5s'}} />
            </div>
          </div>

          {/* Destination Marker */}
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <MapPin className="w-3 h-3 text-white" />
            </div>
            <div className="mt-2 px-2 py-1 bg-white/90 rounded text-xs font-medium text-gray-800 max-w-24 text-center truncate">
              {destination.split(',')[0]}
            </div>
          </div>
        </div>

        {/* Eco-friendly overlay */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-green-500/90 text-white text-xs rounded-full flex items-center">
          <div className="w-2 h-2 bg-white rounded-full mr-1" />
          Eco Route
        </div>

        {/* Map placeholder text */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
          Interactive Map Coming Soon
        </div>
      </div>

      {/* CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}