"use client";
import React, { useEffect, useState } from "react";

interface MapViewProps {
  destination: string;
}

const MapView: React.FC<MapViewProps> = ({ destination }: MapViewProps) => {
  const [mapUrl, setMapUrl] = useState<string>("");

  useEffect(() => {
    // This is a placeholder. In a real app, you would integrate with a mapping API
    // like Google Maps, Mapbox, etc.
    if (destination) {
      // For now, we'll simulate a map update by changing the displayed text
      console.log(`Map updated to show route to: ${destination}`);
    }
  }, [destination]);

  return (
    <div className="relative h-full min-h-[500px] bg-gray-100 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-200 opacity-50"></div>

      {destination ? (
        <div className="relative z-10 text-center p-6 bg-white rounded-md shadow-md">
          <h3 className="text-xl font-medium mb-2">Map View</h3>
          <p className="text-gray-600">
            {destination
              ? `Showing route to ${destination}`
              : "Enter a destination to see the route"}
          </p>
          <div className="mt-4 p-8 bg-gray-100 rounded-md">
            <p className="text-gray-500 italic">
              Map visualization would appear here in a production environment.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative z-10 text-center p-6">
          <p className="text-gray-500">
            Enter a destination to see the route on the map
          </p>
        </div>
      )}
    </div>
  );
};

export default MapView;
