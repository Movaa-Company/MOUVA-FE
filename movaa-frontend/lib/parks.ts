import Fuse from 'fuse.js';

export const PARKS = [
  { name: 'Ajah Park', address: 'Ajah, Lagos', city: 'Lagos', lat: 6.4675, lon: 3.6026 },
  { name: 'Oshodi Park', address: 'Oshodi, Lagos', city: 'Lagos', lat: 6.5483, lon: 3.3584 },
  { name: 'Wuse Park', address: 'Wuse Zone 5, Abuja', city: 'Abuja', lat: 9.0675, lon: 7.4898 },
  // ... add more parks as needed
];

const fuseOptions = {
  keys: ['name', 'address', 'city'],
  threshold: 0.4,
};

export const parkFuse = new Fuse(PARKS, fuseOptions); 