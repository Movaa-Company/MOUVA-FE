import Fuse from 'fuse.js';

// export const PARKS = [
//   { name: 'Ajah Park', address: 'Ajah, Lagos', city: 'Lagos', lat: 6.4675, lon: 3.6026 },
//   { name: 'Oshodi Park', address: 'Oshodi, Lagos', city: 'Lagos', lat: 6.5483, lon: 3.3584 },
//   { name: 'Wuse Park', address: 'Wuse Zone 5, Abuja', city: 'Abuja', lat: 9.0675, lon: 7.4898 },
//   // ... add more parks as needed
// ];

export const PARKS = [
  {
    name: 'Ajah Motor Park',
    city: 'Lagos',
    address: 'No 1. Tinubu Avenue, Ajah Bustop',
    lat: 6.4682,
    lng: 3.5852,
  },
  {
    name: 'Ikeja Bus Terminal',
    city: 'Lagos',
    address: 'Obafemi Awolowo Way, Ikeja',
    lat: 6.6018,
    lng: 3.3515,
  },
  {
    name: 'Yaba Bus Terminal',
    city: 'Lagos',
    address: 'Murtala Muhammed Way, Yaba',
    lat: 6.5095,
    lng: 3.3715,
  },
  {
    name: 'Berger Motor Park',
    city: 'Lagos',
    address: 'Lagos-Ibadan Expressway, Berger',
    lat: 6.5833,
    lng: 3.3667,
  },
  {
    name: 'Mile 2 Motor Park',
    city: 'Lagos',
    address: 'Oshodi-Apapa Expressway, Mile 2',
    lat: 6.4833,
    lng: 3.3167,
  },
  {
    name: 'Kano Central Motor Park',
    city: 'Kano',
    address: 'Katsina Road, Kano',
    lat: 12.0022,
    lng: 8.5919,
  },
  { name: 'Abuja Motor Park', city: 'Abuja', address: 'Nyanya, Abuja', lat: 9.0765, lng: 7.4165 },
  {
    name: 'Port Harcourt Motor Park',
    city: 'Port Harcourt',
    address: 'Mile 3 Diobu, Port Harcourt',
    lat: 4.8156,
    lng: 7.0498,
  },
  {
    name: 'Ibadan Central Motor Park',
    city: 'Ibadan',
    address: 'Challenge, Ibadan',
    lat: 7.3775,
    lng: 3.947,
  },
  { name: 'Kaduna Motor Park', city: 'Kaduna', address: 'Kawo, Kaduna', lat: 10.5105, lng: 7.4165 },
];

const fuseOptions = {
  keys: ['name', 'address', 'city'],
  threshold: 0.4,
};

export const parkFuse = new Fuse(PARKS, fuseOptions);
