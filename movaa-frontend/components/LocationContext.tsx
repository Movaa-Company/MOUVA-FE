'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface LocationContextType {
  permission: PermissionState | null;
  currentCity: string | null;
  requestLocation: () => void;
  loading: boolean;
  error: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'movaa_location_permission';
const LOCAL_STORAGE_CITY = 'movaa_current_city';

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persisted permission and city
  useEffect(() => {
    const savedPermission = localStorage.getItem(LOCAL_STORAGE_KEY);
    const savedCity = localStorage.getItem(LOCAL_STORAGE_CITY);
    if (savedPermission) setPermission(savedPermission as PermissionState);
    if (savedCity) setCurrentCity(savedCity);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (permission) localStorage.setItem(LOCAL_STORAGE_KEY, permission);
    if (currentCity) localStorage.setItem(LOCAL_STORAGE_CITY, currentCity);
  }, [permission, currentCity]);

  const requestLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      setPermission('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setPermission('granted');
        // Reverse geocode to get city name
        try {
          const { latitude, longitude } = position.coords;
          // Use Nominatim OpenStreetMap for reverse geocoding (free, no API key)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
          );
          const data = await res.json();
          const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.state_district ||
            data.address.state ||
            null;
          setCurrentCity(city);
        } catch (e) {
          setError('Could not determine city from location.');
        }
        setLoading(false);
      },
      (err) => {
        setPermission('denied');
        setError('Location permission denied or unavailable.');
        setLoading(false);
      }
    );
  };

  return (
    <LocationContext.Provider value={{ permission, currentCity, requestLocation, loading, error }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within a LocationProvider');
  return ctx;
};
