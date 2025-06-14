import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Input validation
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    throw new Error('Invalid coordinates: All coordinates must be valid numbers');
  }

  // Convert to radians
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers

  // Convert coordinates to radians
  const lat1Rad = toRad(lat1);
  const lon1Rad = toRad(lon1);
  const lat2Rad = toRad(lat2);
  const lon2Rad = toRad(lon2);

  // Haversine formula
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 2 decimal places for consistency
  return Math.round(distance * 100) / 100;
}

// utils/debounce.ts
export function debounce<T extends (...args: any[]) => void>(func: T, delay = 300): T {
  let timer: ReturnType<typeof setTimeout>;
  return function (...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  } as T;
}
