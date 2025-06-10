'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calender';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, X, Loader2, Navigation, ClockIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from './LocationContext';
import { fetchNigerianCities, debounce } from '@/lib/citiesApi';
import { getLoggedInUser, saveBookingData } from '@/lib/localStorageUtils';
import { PARKS } from '@/lib/parks';
import Fuse from 'fuse.js';
import { haversineDistance } from '@/lib/utils';

// Types
type LocationData = {
  city: string;
  street: string;
  lat: number;
  lon: number;
  display_name: string;
};

type Park = {
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
};

type GeoapifyFeature = {
  properties: {
    city?: string;
    name?: string;
    street?: string;
    lat: number;
    lon: number;
  };
};

type NominatimResult = {
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    road?: string;
    neighbourhood?: string;
  };
  display_name: string;
  lat: string;
  lon: string;
};

// Enhanced Parks data with more Nigerian locations

// Enhanced Nigerian cities for better autocomplete
const NIGERIAN_CITIES = [
  'Lagos',
  'Abuja',
  'Kano',
  'Ibadan',
  'Port Harcourt',
  'Benin City',
  'Kaduna',
  'Jos',
  'Ilorin',
  'Aba',
  'Onitsha',
  'Warri',
  'Sokoto',
  'Calabar',
  'Uyo',
  'Enugu',
  'Abeokuta',
  'Akure',
  'Bauchi',
  'Maiduguri',
  'Zaria',
  'Owerri',
  'Osogbo',
  'Awka',
  'Asaba',
  'Lokoja',
  'Lafia',
  'Makurdi',
  'Gombe',
  'Yola',
  'Minna',
  'Birnin Kebbi',
  'Dutse',
  'Katsina',
  'Damaturu',
  'Jalingo',
  'Yenagoa',
  'Abakaliki',
  'Umuahia',
];

const formSchema = z.object({
  destination: z.string().min(2, { message: 'Destination city is required' }),
  from: z.string().min(2, { message: 'Departure city is required' }),
  date: z.date({ required_error: 'Travel date is required' }),
  time: z.string({ required_error: 'Pick-up time is required' }),
  tickets: z.number().min(1, { message: 'No. of ticket is required' }),
  children: z.number().max(20).optional(),
  takeOffPark: z.string().min(2, { message: 'Take-off park is required' }),
});

type BookingFormValues = z.infer<typeof formSchema>;

interface BookingFormProps {
  onDestinationChange: (destination: string) => void;
}

// Utility functions

// Enhanced geocoding with multiple providers
const geocodeLocation = async (query: string): Promise<LocationData[]> => {
  const results: LocationData[] = [];

  try {
    // Primary: Nominatim (free, no API key required)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=ng&q=${encodeURIComponent(query)}`;
    const response = await fetch(nominatimUrl);
    const data = await response.json();

    data.forEach((item: any) => {
      const city =
        item.address?.city ||
        item.address?.town ||
        item.address?.village ||
        item.address?.state ||
        '';
      const street = item.address?.road || item.address?.neighbourhood || '';

      if (city) {
        results.push({
          city,
          street,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          display_name: item.display_name,
        });
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Geocoding error:', error.message);
    } else {
      console.error('Unknown geocoding error occurred');
    }
  }

  return results;
};

const reverseGeocode = async (lat: number, lon: number): Promise<LocationData | null> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    const response = await fetch(url);
    const data = await response.json();

    const city =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.state ||
      '';
    const street = data.address?.road || data.address?.neighbourhood || '';

    return {
      city,
      street,
      lat,
      lon,
      display_name: data.display_name,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

const BookingForm = ({ onDestinationChange }: BookingFormProps) => {
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: '',
      from: '',
      date: undefined,
      time: '',
      tickets: 1,
      children: 0,
      takeOffPark: '',
    },
  });

  // Location states
  const [fromInput, setFromInput] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState<LocationData[]>([]);
  const [fromLoading, setFromLoading] = useState(false);
  const [fromSelected, setFromSelected] = useState<LocationData | null>(null);
  const [fromPopoverOpen, setFromPopoverOpen] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>(
    'prompt'
  );
  const [autoDetecting, setAutoDetecting] = useState(false);

  // Destination states
  const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([]);
  const [destinationLoading, setDestinationLoading] = useState(false);

  // Park states
  const [selectedPark, setSelectedPark] = useState<Park | null>(null);
  const [nearestParks, setNearestParks] = useState<Array<Park & { distance: number }>>([]);
  const [showParkSelection, setShowParkSelection] = useState(false);
  const [parkSearch, setParkSearch] = useState('');

  // UI states
  const [showLocationNudge, setShowLocationNudge] = useState(false);
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const [childrenError, setChildrenError] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const fromInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized values
  const timeOptions = useMemo(
    () => [
      '6:00 AM',
      '7:00 AM',
      '8:00 AM',
      '9:00 AM',
      '10:00 AM',
      '11:00 AM',
      '12:00 PM',
      '1:00 PM',
      '2:00 PM',
      '3:00 PM',
      '4:00 PM',
      '5:00 PM',
      '6:00 PM',
    ],
    []
  );

  // Auto-detect location on mount
  useEffect(() => {
    const detectLocation = async () => {
      if (!navigator.geolocation) {
        setShowLocationNudge(true);
        setTimeout(() => setShowLocationNudge(false), 3000);
        return;
      }

      setAutoDetecting(true);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const location = await reverseGeocode(latitude, longitude);

          if (location && location.city) {
            const displayText =
              location.street && location.city
                ? `${location.street.length > 15 ? location.street.slice(0, 15) + '...' : location.street}, ${location.city}`
                : location.city;

            setFromInput(displayText);
            setFromSelected(location);
            setLocationPermission('granted');
          }
          setAutoDetecting(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationPermission('denied');
          setShowLocationNudge(true);
          setTimeout(() => setShowLocationNudge(false), 3000);
          setAutoDetecting(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    };

    // Only auto-detect if no location is already set
    if (!fromInput && !fromSelected) {
      detectLocation();
    }
  }, []);

  // Calculate nearest parks when location changes
  useEffect(() => {
    if (!fromSelected?.lat || !fromSelected?.lon) {
      setNearestParks([]);
      setSelectedPark(null);
      return;
    }

    const parksWithDistance = PARKS.map((park) => ({
      ...park,
      distance: haversineDistance(fromSelected.lat, fromSelected.lon, park.lat, park.lng),
    })).sort((a, b) => a.distance - b.distance);

    setNearestParks(parksWithDistance);

    // Auto-select nearest park
    if (parksWithDistance.length > 0) {
      const nearest = parksWithDistance[0];
      setSelectedPark(nearest);
      form.setValue('takeOffPark', nearest.name);
    }
  }, [fromSelected, form, PARKS, setNearestParks, setSelectedPark]);

  // Update nearest park when from location changes
  useEffect(() => {
    if (fromSelected?.city && fromInput.trim()) {
      // Use the first park from nearestParks array since it's already sorted by distance
      const nearest = nearestParks[0];
      if (nearest) {
        setSelectedPark(nearest);
        form.setValue('takeOffPark', nearest.name);
      }
    }
  }, [fromSelected, fromInput, form, nearestParks, setSelectedPark]);

  // Debounced search functions
  const debouncedFromSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setFromSuggestions([]);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setFromLoading(true);
      try {
        const suggestions = await geocodeLocation(query);
        setFromSuggestions(suggestions.slice(0, 5));
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Search error:', error);
        }
      } finally {
        setFromLoading(false);
      }
    }, 500),
    [setFromSuggestions, setFromLoading, geocodeLocation]
  );

  const debouncedDestinationSearch = useCallback(
    debounce((query: string) => {
      if (query.length < 2) {
        setDestinationSuggestions([]);
        return;
      }

      const filtered = NIGERIAN_CITIES.filter((city) =>
        city.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);

      setDestinationSuggestions(filtered);
    }, 300),
    [setDestinationSuggestions, NIGERIAN_CITIES]
  );

  // Handlers
  const handleFromInputChange = (value: string) => {
    setFromInput(value);
    setFromSelected(null);
    form.setValue('from', value);

    if (value.length >= 2) {
      setFromPopoverOpen(true);
      debouncedFromSearch(value);
    } else {
      setFromPopoverOpen(false);
      setFromSuggestions([]);
    }
  };

  const handleFromSelect = (location: LocationData) => {
    const displayText =
      location.street && location.city ? `${location.street}, ${location.city}` : location.city;

    setFromInput(displayText);
    setFromSelected(location);
    setFromPopoverOpen(false);
    form.setValue('from', displayText);
  };

  const clearFromLocation = () => {
    setFromInput('');
    setFromSelected(null);
    setFromSuggestions([]);
    setFromPopoverOpen(false);
    form.setValue('from', '');
    fromInputRef.current?.focus();
  };

  const handleDestinationChange = (value: string) => {
    form.setValue('destination', value);
    onDestinationChange(value);
    debouncedDestinationSearch(value);
  };

  const validateChildren = (children: number, tickets: number): boolean => {
    if (children > tickets) {
      setChildrenError(
        'Only one child per ticket booked is allowed. Please select more ticket(s).'
      );
      return false;
    }
    setChildrenError(null);
    return true;
  };

  const onSubmit = (data: BookingFormValues) => {
    setFormError('');

    // Validation
    if (!fromSelected?.city && !fromInput.trim()) {
      setFormError('Please enter a valid departure location.');
      return;
    }

    if (!selectedPark) {
      setFormError('Please select a take-off park.');
      return;
    }

    if (!validateChildren(data.children ?? 0, data.tickets)) {
      return;
    }

    // Create booking data
    const bookingData = {
      destination: data.destination,
      from: fromSelected?.city || fromInput.trim(),
      fromDetails: fromSelected,
      takeOffPark: selectedPark,
      date: data.date,
      time: data.time,
      tickets: data.tickets,
      children: data.children || 0,
    };

    try {
      // Save to localStorage (replace with your actual storage logic)
      localStorage.setItem('bookingData', JSON.stringify(bookingData));

      // Check authentication (replace with your actual auth logic)
      const isLoggedIn = false; // Replace with actual auth check

      if (isLoggedIn) {
        toast.success('Proceeding to booking details...');
        router.push('/booking-details');
      } else {
        setOpenAuthDialog(true);
      }
    } catch (error) {
      console.error('Error saving booking data:', error);
      setFormError('An error occurred while processing your booking. Please try again.');
    }
  };

  return (
    <div className="booking-form bg-white p-4 md:p-6 rounded-2xl shadow-lg max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Destination Field */}
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Travelling to</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Travelling to"
                      className="pl-10 h-12 rounded-xl font-medium text-lg md:text-lg border-2 focus:border-movaa-light focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none transition-colors text-gray-500"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleDestinationChange(e.target.value);
                      }}
                      autoComplete="off"
                    />
                    {destinationSuggestions.length > 0 && (
                      <ul className="absolute z-20 bg-white border-2 border-gray-100 rounded-xl w-full mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {destinationSuggestions.map((city) => (
                          <li
                            key={city}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0"
                            onClick={() => {
                              form.setValue('destination', city);
                              setDestinationSuggestions([]);
                              onDestinationChange(city);
                            }}
                          >
                            <div className="font-medium">{city}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* From Field */}
          <div className="relative">
            <label htmlFor="from-input" className="sr-only">
              From location
            </label>
            <Popover open={fromPopoverOpen} onOpenChange={setFromPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="from-input"
                    ref={fromInputRef}
                    className="w-full h-12 pl-10 pr-12 rounded-xl border-2 focus:border-movaa-light font-medium text-lg focus:outline-none transition-colors text-gray-500"
                    placeholder={autoDetecting ? 'Detecting location...' : 'From (Street, City)'}
                    value={fromInput}
                    onChange={(e) => handleFromInputChange(e.target.value)}
                    onFocus={() => {
                      if (fromInput.length >= 2 && !autoDetecting) {
                        setFromPopoverOpen(true);
                      }
                    }}
                    disabled={autoDetecting}
                    autoComplete="off"
                  />
                  {autoDetecting && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-blue-500" />
                  )}
                  {fromInput && !autoDetecting && (
                    <button
                      type="button"
                      onClick={clearFromLocation}
                      className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100"
                      aria-label="Clear location"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </PopoverTrigger>

              <PopoverContent className="w-full p-0 border-2" align="start">
                {fromLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Searching...
                  </div>
                ) : fromSuggestions.length ? (
                  <ul className="max-h-64 overflow-y-auto">
                    {fromSuggestions.map((item, idx) => (
                      <li
                        key={`${item.city}-${item.lat}-${item.lon}`}
                        className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                        onClick={() => handleFromSelect(item)}
                      >
                        <div className="font-medium">
                          {item.street && item.city ? `${item.street}, ${item.city}` : item.city}
                        </div>
                        {item.street && item.city && (
                          <div className="text-sm text-gray-500">{item.city}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No locations found. Please try a different search.
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {showLocationNudge && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                Enable location services for better experience
              </div>
            )}
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Field */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Travel Date</FormLabel>
                  <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full h-12 justify-start text-left font-medium text-lg rounded-xl border-2 hover:border-movaa-light text-gray-500 pl-10 relative"
                        >
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          {field.value ? format(field.value, 'PPP') : <span>Select date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setDatePopoverOpen(false);
                        }}
                        disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Field */}
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Departure Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-12 rounded-xl border-2 font-medium text-lg focus:border-movaa-light focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none text-gray-500 pl-10 relative">
                      <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tickets and Children Row */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            {/* Tickets Field */}
            <FormField
              control={form.control}
              name="tickets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Number of Tickets</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const numValue = parseInt(value);
                      field.onChange(numValue);

                      // Reset children if exceeds tickets
                      const children = form.getValues('children') ?? 0;
                      if (children > numValue) {
                        form.setValue('children', numValue);
                        setChildrenError(null);
                      }
                    }}
                    defaultValue={field.value?.toString() || '1'}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 font-medium text-lg focus:border-movaa-light focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none text-gray-500">
                      <SelectValue placeholder="No. of Tickets" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'ticket' : 'tickets'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Children Field */}
            <FormField
              control={form.control}
              name="children"
              render={({ field }) => {
                const ticketCount = form.watch('tickets') || 1;
                const childrenOptions = Array.from({ length: ticketCount + 1 }, (_, i) => i);

                return (
                  <FormItem>
                    <FormLabel className="sr-only">Number of Children</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const numValue = parseInt(value);
                        field.onChange(numValue);
                        validateChildren(numValue, ticketCount);
                      }}
                      defaultValue={field.value?.toString() || '0'}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-2 font-medium text-lg focus:border-movaa-light focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none text-gray-500">
                        <SelectValue placeholder="Children?" />
                      </SelectTrigger>
                      <SelectContent>
                        {childrenOptions.map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num <= 1 ? 'child' : 'children'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {childrenError && (
                      <div className="text-red-500 text-sm mt-1">{childrenError}</div>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          {/* Park Selection */}
          {nearestParks.length > 0 && (
            <div className="bg-green-50 p-4 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-lg mb-3">Closest Park</h3>
              {!showParkSelection ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{selectedPark?.name}</div>
                    <div className="text-sm text-gray-600">
                      {selectedPark?.address} • {nearestParks[0]?.distance.toFixed(1)} km away
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowParkSelection(true)}
                    className="text-movaa-primary border-movaa-light hover:bg-blue-100"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search parks..."
                      className="flex-1 h-10 focus:outline-none px-3 rounded-lg border-2 focus:border-movaa-light"
                      value={parkSearch}
                      onChange={(e) => setParkSearch(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowParkSelection(false)}
                      className="text-movaa-primary border-movaa-primary hover:bg-movaa-light"
                    >
                      Cancel
                    </Button>
                  </div>
                  <ul className="max-h-48 overflow-y-auto space-y-2">
                    {nearestParks
                      .filter(
                        (park) =>
                          park.name.toLowerCase().includes(parkSearch.toLowerCase()) ||
                          park.address.toLowerCase().includes(parkSearch.toLowerCase())
                      )
                      .map((park) => (
                        <li
                          key={park.name}
                          className="p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-movaa-light"
                          onClick={() => {
                            setSelectedPark(park);
                            setShowParkSelection(false);
                            form.setValue('takeOffPark', park.name);
                          }}
                        >
                          <div className="font-medium">{park.name}</div>
                          <div className="text-sm text-gray-600">
                            {park.address} • {park.distance.toFixed(1)} km away
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {formError && (
            <div className="text-red-500 text-sm" role="alert">
              {formError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-lg font-medium font-baloo rounded-[12px] bg-movaa-primary hover:bg-movaa-dark text-white"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Proceed'
            )}
          </Button>
        </form>
      </Form>

      <Dialog open={openAuthDialog} onOpenChange={setOpenAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogDescription>
              You need to be signed in to proceed with the booking.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-movaa-primary hover:underline">
                  Sign Up
                </Link>
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingForm;
