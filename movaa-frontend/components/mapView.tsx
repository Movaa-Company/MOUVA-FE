'use client';
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// You may need to fix marker icons for Leaflet in Next.js/CRA
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

interface MapViewProps {
  userCoords?: { lat: number; lng: number };
  terminalCoords?: { lat: number; lng: number };
  terminalName?: string;
}

const MapView: React.FC<MapViewProps> = ({
  userCoords = { lat: 6.4682, lng: 3.5852 }, // fallback to Ajah
  terminalCoords = { lat: 6.4682, lng: 3.5852 },
  terminalName = 'Ajah Motor Pack',
}) => {
  return (
    <div className="relative h-full min-h-[300px] bg-gray-100 flex items-center justify-center rounded-md overflow-hidden">
      <MapContainer
        center={[userCoords.lat, userCoords.lng]}
        zoom={13}
        style={{ height: '300px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      <Marker position={[userCoords.lat, userCoords.lng]}>
          <Popup>Your Location</Popup>
        </Marker>
        <Marker position={[terminalCoords.lat, terminalCoords.lng]}>
          <Popup>{terminalName}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapView;
