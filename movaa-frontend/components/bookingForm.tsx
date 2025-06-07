"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calender";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "./LocationContext";
import { fetchNigerianCities, debounce } from "@/lib/citiesApi";
import { useToast } from "@/hooks/use-toast";
import { getLoggedInUser, saveBookingData } from "@/lib/localStorageUtils";
import { PARKS } from "@/lib/parks";
import Fuse from "fuse.js";
import { haversineDistance } from "@/lib/utils";

// Sample terminal data (city, name, coordinates)
const TERMINALS = [
  { city: "Ajah", name: "Ajah Motor Pack", lat: 6.4682, lng: 3.5852, address: "No 1. Tinubu Avenue, Ajah Bustop" },
  { city: "Ikeja", name: "Ikeja Bus Terminal", lat: 6.6018, lng: 3.3515, address: "Obafemi Awolowo Way, Ikeja" },
  { city: "Yaba", name: "Yaba Bus Terminal", lat: 6.5095, lng: 3.3715, address: "Murtala Muhammed Way, Yaba" },
  // Add more as needed
];

type LocationData = {
  city: string;
  street: string;
  lat: number;
  lon: number;
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

const formSchema = z.object({
  destination: z.string().min(2, { message: "Destination city is required" }),
  from: z.string().min(2, { message: "Departure city is required" }),
  date: z.date({ required_error: "Travel date is required" }),
  time: z.string({ required_error: "Pick-up time is required" }),
  tickets: z.number().min(1, { message: "No. of ticket is required" }),
  children: z.number().max(20).optional(),
  takeOffPark: z.string().min(2, { message: "Take-off park is required" }),
});

type BookingFormValues = z.infer<typeof formSchema>;

interface BookingFormProps {
  onDestinationChange: (destination: string) => void;
}

const visuallyHidden = "sr-only";

const BookingForm = ({ onDestinationChange }: BookingFormProps) => {
  const router = useRouter();
  const { permission, currentCity, requestLocation, loading: locationLoading, error: locationError } = useLocation();
  const { toast } = useToast();
  const [isLoggedIn] = useState(false); // Replace with actual authentication logic
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [fromInput, setFromInput] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [fromLoading, setFromLoading] = useState(false);
  const [fromSelected, setFromSelected] = useState<any>(null);
  const [showFromTooltip, setShowFromTooltip] = useState(false);
  const [fromPopoverOpen, setFromPopoverOpen] = useState(false);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const [childrenError, setChildrenError] = useState<string | null>(null);
  const [nearestPark, setNearestPark] = useState<any>(null);
  const [selectedPark, setSelectedPark] = useState<any>(null);
  const [changeParkMode, setChangeParkMode] = useState(false);
  const [parkSearch, setParkSearch] = useState("");
  const [parkSuggestions, setParkSuggestions] = useState<any[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [formError, setFormError] = useState("");
  const [hasCleared, setHasCleared] = useState(false);
  const [hasUserClearedLocation, setHasUserClearedLocation] = useState(false);
  const [autoDetectedLocation, setAutoDetectedLocation] = useState<LocationData | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: "",
      from: currentCity || "",
      date: undefined,
      time: "",
      tickets: 1,
      children: 0,
      takeOffPark: "",
    },
  });

  // Update 'from' field if currentCity changes
  useEffect(() => {
    if (currentCity && !form.getValues("from")) {
      form.setValue("from", currentCity);
    }
  }, [currentCity]);

  // Nudge for location permission if denied
  useEffect(() => {
    if (permission === "denied" && locationError) {
      toast.error("Please enable location services for best experience.");
    }
  }, [permission, locationError]);

  // Autocomplete handlers
  const handleCityInput = debounce(async (value: string) => {
    setCitySuggestions(await fetchNigerianCities(value));
  }, 300);

  useEffect(() => {
    if (fromSelected?.city) {
      form.setValue("from", fromSelected.city);
    } else if (fromInput.trim()) {
      form.setValue("from", fromInput.trim());
    }
  }, [fromSelected, fromInput, form]);
  
  // Update park selection to sync with form
  useEffect(() => {
    if (selectedPark?.name) {
      form.setValue("takeOffPark", selectedPark.name);
    }
  }, [selectedPark, form]);

  
  useEffect(() => {
    if (hasCleared || hasUserClearedLocation) return;
    
    const hydrate = () => {
      const saved = localStorage.getItem("fromLocation");
      if (saved) {
        const obj = JSON.parse(saved);
        const displayText = obj.street && obj.city ? `${obj.street}, ${obj.city}` : obj.city || "";
        setFromInput(displayText);
        setFromSelected(obj);
        setAutoDetectedLocation(obj);
        return true;
      }
      return false;
    };
    
    // Only auto-detect location if no saved data AND input is empty AND user hasn't cleared
    if (hydrate() || fromInput.length > 0) return;
    
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }
    
    console.log("Requesting geolocation...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        console.log("Got geolocation position:", pos);
        // Only set location if user hasn't typed anything yet and hasn't cleared
        if (fromInput.length > 0 || hasCleared || hasUserClearedLocation) {
          console.log("Skipping auto-detection - input exists or location cleared");
          return;
        }
        
        const { latitude, longitude } = pos.coords;
        setFromLoading(true);
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
          console.log("Fetching location data from:", url);
          const res = await fetch(url);
          const data = await res.json();
          console.log("Location data received:", data);
          
          const city = data.address.city || data.address.town || data.address.village || data.address.state || "";
          const street = data.address.road || data.address.neighbourhood || "";
          
          console.log("Parsed location:", { city, street });
          
          // Only set if input is still empty and user hasn't cleared
          if (fromInput.length === 0 && !hasUserClearedLocation) {
            const locationObj = { city, street, lat: latitude, lon: longitude };
            const displayText = street && city ? `${street}, ${city}` : city;
            
            console.log("Setting location:", { locationObj, displayText });
            setFromInput(displayText);
            setFromSelected(locationObj);
            setAutoDetectedLocation(locationObj);
            localStorage.setItem("fromLocation", JSON.stringify(locationObj));
          }
        } catch (error) {
          console.error("Error fetching location:", error);
        }
        setFromLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        // Fallback: show tooltip for manual entry
        setTimeout(() => setShowFromTooltip(true), 2000);
      },
      { timeout: 5000 }
    );
  }, [fromInput.length, hasUserClearedLocation]);
  // Debounced autocomplete for city
  useEffect(() => {
    if (!fromInput || hasUserClearedLocation === false) {
      setFromSuggestions([]);
      return;
    }
    
    // Only search if user has typed at least 2 characters
    if (fromInput.length < 3) {
      setFromSuggestions([]);
      return;
    }
    
    setFromLoading(true);
    const handler = setTimeout(async () => {
      // Skip if this is auto-detected location (not user-typed)
      if (autoDetectedLocation && 
          ((autoDetectedLocation.street && autoDetectedLocation.city && 
            fromInput === `${autoDetectedLocation.street}, ${autoDetectedLocation.city}`) ||
           fromInput === autoDetectedLocation.city)) {
        setFromLoading(false);
        return;
      }
      
      // API calls for suggestions...
      let suggestions: LocationData[] = [];
      const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
      if (GEOAPIFY_KEY) {
        const geoapifyUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(fromInput)}&type=city&limit=10&apiKey=${GEOAPIFY_KEY}`;
        const geoapifyRes = await fetch(geoapifyUrl);
        const geoapifyData = await geoapifyRes.json();
        suggestions = geoapifyData.features.map((f: GeoapifyFeature) => ({
          city: f.properties.city || f.properties.name || "",
          street: f.properties.street || "",
          lat: f.properties.lat,
          lon: f.properties.lon,
        }));
      } else {
        // Nominatim fallback
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=10&city=${encodeURIComponent(fromInput)}`;
        const nominatimRes = await fetch(nominatimUrl);
        const nominatimData = await nominatimRes.json();
        suggestions = nominatimData.map((item: NominatimResult) => ({
          city: item.address.city || item.address.town || item.address.village || item.address.state || item.display_name,
          street: item.address.road || item.address.neighbourhood || "",
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }));
      }
      
      // Fuzzy match with Fuse.js if needed
      const fuse = new Fuse(suggestions, { keys: ["city"], threshold: 0.4 });
      const results = fuse.search(fromInput);
      setFromSuggestions(results.length ? results.map(r => r.item) : suggestions);
      setFromLoading(false);
    }, 500); // 500ms debounce for better UX
    
    return () => clearTimeout(handler);
  }, [fromInput, hasUserClearedLocation, autoDetectedLocation]);
  // Handle selection
 

  const handleFromSelect = (item: LocationData) => {
    const displayText = item.street && item.city ? `${item.street}, ${item.city}` : item.city;
    setFromInput(displayText);
    setFromSelected(item);
    setHasUserClearedLocation(true); // User made a manual selection
    setFromPopoverOpen(false);
    localStorage.setItem("fromLocation", JSON.stringify(item));
  };

  const handleFromBlur = () => {
    // Only auto-set fromSelected if user has typed something and hasn't selected from suggestions
    if (!fromSelected && fromInput.trim().length > 1) {
      const locationData = { city: fromInput.trim() };
      setFromSelected(locationData);
      localStorage.setItem("fromLocation", JSON.stringify(locationData));
    }
    // If user cleared the field completely, clear everything
    else if (fromInput.trim().length === 0) {
      setFromSelected(null);
      localStorage.removeItem("fromLocation");
    }
  };
  


const clearFromLocation = () => {
  setFromInput("");
  setFromSelected(null);
  setAutoDetectedLocation(null);
  setHasUserClearedLocation(true); // Prevent auto-detection for this session
  localStorage.removeItem("fromLocation");
  setFromSuggestions([]);
  setHasCleared(true);
  fromInputRef.current?.focus();
};

const handleFromInputChange = (newValue: string) => {
  setFromInput(newValue);
  
  // Only open popover if we have suggestions or are loading
  if (newValue.length >= 5) {
    setFromPopoverOpen(true);
  }
  
  // If user starts typing over auto-detected location, mark as user-cleared
  if (autoDetectedLocation && newValue !== 
      (autoDetectedLocation.street && autoDetectedLocation.city ? 
       `${autoDetectedLocation.street}, ${autoDetectedLocation.city}` : 
       autoDetectedLocation.city)) {
    setHasUserClearedLocation(true);
    setAutoDetectedLocation(null);
  }
  
  if (fromSelected && newValue !== fromSelected.city) {
    setFromSelected(null);
    localStorage.removeItem("fromLocation");
  }
};
  
  // Children validation
  const validateChildren = (children: number, tickets: number) => {
    if (children > tickets) {
      setChildrenError("Only one child per ticket booked is allowed. Please select more ticket(s).");
      return false;
    }
    setChildrenError(null);
    return true;
  };

  // On mount, hydrate selectedPark from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("selectedPark");
    if (saved) setSelectedPark(JSON.parse(saved));
  }, []);

  // On fromSelected change, calculate nearest park
  useEffect(() => {
    if (!fromSelected || !fromSelected.lat || !fromSelected.lon) return;
    let minDist = Infinity;
    let nearest = null;
    for (const park of PARKS) {
      const dist = haversineDistance(
        Number(fromSelected.lat),
        Number(fromSelected.lon),
        park.lat,
        park.lon
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = park;
      }
    }
    setNearestPark(nearest);
    if (!selectedPark || !changeParkMode) {
      setSelectedPark(nearest);
      localStorage.setItem("selectedPark", JSON.stringify(nearest));
    }
  }, [fromSelected]);

  // Park search (fuzzy, debounced)
  useEffect(() => {
    if (!changeParkMode) return;
    const handler = setTimeout(() => {
      if (!parkSearch) {
        setParkSuggestions(PARKS.slice(0, 10));
        return;
      }
      const fuse = new Fuse(PARKS, { keys: ["name", "address", "city"], threshold: 0.4 });
      const results = fuse.search(parkSearch);
      setParkSuggestions(results.length ? results.map(r => r.item).slice(0, 10) : []);
    }, 300);
    return () => clearTimeout(handler);
  }, [parkSearch, changeParkMode]);

  const handleParkSelect = (park: any) => {
    setSelectedPark(park);
    setChangeParkMode(false);
    setShowMap(false);
    localStorage.setItem("selectedPark", JSON.stringify(park));
  };
  const handleAutoPark = () => {
    setSelectedPark(nearestPark);
    setChangeParkMode(false);
    setShowMap(false);
    localStorage.setItem("selectedPark", JSON.stringify(nearestPark));
  };

  const onSubmit = (data: BookingFormValues) => {
    console.log("Form submission started", data); // Debug log
    setFormError("");
  
    // Handle fromSelected validation more flexibly
    let finalFromSelected = fromSelected;
    if (!finalFromSelected && fromInput.trim().length > 1) {
      finalFromSelected = { city: fromInput.trim() };
      setFromSelected(finalFromSelected);
      localStorage.setItem("fromLocation", JSON.stringify(finalFromSelected));
    }
  
    // Validation checks with specific error messages
    if (!finalFromSelected || !finalFromSelected.city) {
      setFormError("Please enter a valid departure city.");
      console.log("Validation failed: No from location"); 
      return;
    }
  
    if (!selectedPark || !selectedPark.name) {
      setFormError("Please select a take-off park.");
      console.log("Validation failed: No park selected"); 
      return;
    }
  
    if (!validateChildren(data.children ?? 0, data.tickets)) {
      console.log("Validation failed: Children validation"); 
      return;
    }
  
    // Additional field validations
    if (!data.destination || data.destination.trim().length < 2) {
      setFormError("Please enter a valid destination.");
      console.log("Validation failed: No destination"); 
      return;
    }
  
    if (!data.date) {
      setFormError("Please select a travel date.");
      console.log("Validation failed: No date"); 
      return;
    }
  
    if (!data.time) {
      setFormError("Please select a departure time.");
      console.log("Validation failed: No time"); 
      return;
    }
  
    console.log("All validations passed, assembling booking data"); 
  
    // Assemble bookingData
    const bookingData = {
      destination: data.destination,
      from: finalFromSelected.city,
      fromDetails: finalFromSelected,
      takeOffPark: selectedPark,
      date: data.date,
      time: data.time,
      tickets: data.tickets,
      children: data.children || 0,
    };
  
    console.log("Booking data assembled:", bookingData); // Debug log
  
    try {
      saveBookingData(bookingData);
      console.log("Booking data saved successfully"); // Debug log
  
      // Check if user is logged in
      const loggedInUser = getLoggedInUser();
      if (loggedInUser) {
        console.log("User is logged in, redirecting to booking details"); // Debug log
        toast.success("Proceeding to booking details...");
        router.push("/booking-details"); // Make sure this route exists
      } else {
        console.log("User not logged in, opening auth dialog"); // Debug log
        setOpenAuthDialog(true);
      }
    } catch (error) {
      console.error("Error saving booking data:", error);
      setFormError("An error occurred while processing your booking. Please try again.");
    }
  };
  
  return (
    <div className="booking-form bg-slate-100 p-5 rounded-[12px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Travelling to */}
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={visuallyHidden}>Travelling to</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Travelling to"
                      className="rounded-[12px] font-semibold text-[18px] text-[#7A7A7A]"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleCityInput(e.target.value);
                        onDestinationChange(e.target.value);
                      }}
                      autoComplete="off"
                    />
                    {citySuggestions.length > 0 && (
                      <ul className="absolute z-10 bg-white border rounded w-full mt-1 max-h-40 overflow-y-auto">
                        {citySuggestions.map((city) => (
                          <li
                            key={city}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              form.setValue("destination", city);
                              setCitySuggestions([]);
                            }}
                          >
                            {city}
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

          {/* From */}
          <div className="mb-4">
            <Popover open={fromPopoverOpen} onOpenChange={setFromPopoverOpen}>
            <PopoverTrigger asChild>
            <div className="relative w-full">
                <input
                  id="from-input"
                  ref={fromInputRef}
                  className="w-full rounded-[12px] border px-3 py-2 text-[16px] font-semibold text-[#7A7A7A] focus:outline-none focus:ring-2 focus:ring-movaa-primary text-left pr-10"
                  placeholder="From"
                  value={fromInput}
                  onChange={(e) => handleFromInputChange(e.target.value)}
                  onFocus={() => {
                    if (fromInput.length >= 2) {
                      setFromPopoverOpen(true);
                    }
                  }}
                  onBlur={handleFromBlur}
                  aria-autocomplete="list"
                  aria-controls="from-suggestions-listbox"
                  aria-expanded={fromPopoverOpen}
                  aria-activedescendant={fromSuggestions.length ? `from-suggestion-0` : undefined}
                  autoComplete="off"
                />
                {fromInput && (
                  <button
                    type="button"
                    onClick={clearFromLocation}
                    className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-red-500 focus:outline-none w-4 h-4 flex items-center justify-center text-sm font-bold"
                    aria-label="Clear location"
                    style={{ fontSize: '12px', lineHeight: '1' }}
                  >
                    ✕
                  </button>
                )}
              </div>
          </PopoverTrigger>

              <PopoverContent className="w-full p-0" align="start">
                {fromLoading ? (
                  <div className="p-3 text-gray-500">Loading...</div>
                ) : fromSuggestions.length ? (
                  <ul role="listbox" id="from-suggestions-listbox" className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                    {fromSuggestions.map((item, idx) => (
                     <li
                     key={item.city + item.lat + item.lon}
                     id={`from-suggestion-${idx}`}
                     role="option"
                     tabIndex={0}
                     className="px-4 py-2 cursor-pointer hover:bg-movaa-primary/10 focus:bg-movaa-primary/20"
                     onClick={() => handleFromSelect(item)}
                     onKeyDown={e => { if (e.key === "Enter") handleFromSelect(item); }}
                     aria-selected={fromInput === (item.street && item.city ? `${item.street}, ${item.city}` : item.city)}
                   >
                     <div className="font-semibold text-base">
                       {item.street && item.city ? `${item.street}, ${item.city}` : item.city}
                     </div>
                     {item.street && item.city && (
                       <div className="text-xs text-gray-500">
                         {item.city}
                       </div>
                     )}
                   </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-gray-500">No matches, please select a valid location.</div>
                )}
              </PopoverContent>
            </Popover>
            {showFromTooltip && (
              <div className="text-xs text-red-500 mt-1">Enable location for best experience.</div>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
            {/* Date Field */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={visuallyHidden}>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left flex justify-between text-[#7A7A7A] rounded-[12px] font-semibold text-[16px]"
                          {...field}
                          value={field.value ? format(field.value, "PPP") : ""}
                          onClick={() => field.onBlur()}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span className="text-muted-foreground">Date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />

            {/* Time Field */}
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={visuallyHidden}>Pick Time</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                      <SelectTrigger className="rounded-[12px] text-[#7A7A7A] font-semibold text-[16px]">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6:00am">6:00am</SelectItem>
                      <SelectItem value="9:00am">9:00am</SelectItem>
                      <SelectItem value="12:00pm">12:00pm</SelectItem>
                      <SelectItem value="3:00pm">3:00pm</SelectItem>
                      <SelectItem value="6:00pm">6:00pm</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* No. of Ticket and Children Fields */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
            {/* No. of Ticket */}
            <FormField
              control={form.control}
              name="tickets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={visuallyHidden}>No. of Ticket</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(parseInt(value));
                      // Reset children if new ticket count is less than children
                      const children = form.getValues("children") ?? 0;
                      if (children > parseInt(value)) {
                        form.setValue("children", parseInt(value));
                        setChildrenError(null);
                      }
                    }}
                    defaultValue={field.value?.toString() || "1"}
                  >
                      <SelectTrigger className="rounded-[12px] text-[#7A7A7A] font-semibold text-[16px]">
                        <SelectValue placeholder="No. of Ticket" />
                      </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? "ticket" : "tickets"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Children */}
            <FormField
              control={form.control}
              name="children"
              render={({ field }) => {
                const ticketCount = form.watch("tickets") || 1;
                const childrenOptions = Array.from({ length: ticketCount + 1 }, (_, i) => i);
                return (
                  <FormItem>
                    <FormLabel className={visuallyHidden}>Children?</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const val = parseInt(value);
                        field.onChange(val);
                        validateChildren(val, ticketCount);
                      }}
                      defaultValue={field.value?.toString() || "0"}
                    >
                        <SelectTrigger className="rounded-[12px] text-[#7A7A7A] font-semibold text-[16px]">
                          <SelectValue placeholder="Children?" />
                        </SelectTrigger>
                      <SelectContent>
                        {childrenOptions.map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num <= 1 ? "child" : "children"}
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

          {/* Nearest Park & Change Park Logic */}
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {!changeParkMode ? (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="font-semibold text-movaa-primary hover:underline focus:outline-none"
                      onClick={() => setShowMap((v) => !v)}
                      aria-label={selectedPark ? `Map showing directions to ${selectedPark.name}` : undefined}
                    >
                      Nearest Park: {selectedPark ? `${selectedPark.name}, ${selectedPark.city}` : "-"}
                      <span className="ml-1">▼</span>
                    </button>
                    <button
                      type="button"
                      className="border-2 border-movaa-primary rounded-[12px] text-movaa-primary text-xs px-3 py-1 ml-2 font-medium hover:bg-movaa-primary/10"
                      onClick={() => setChangeParkMode(true)}
                    >
                      Change Park
                    </button>
                  </div>
                  {showMap && selectedPark && fromSelected && (
                    <div className="mt-2 w-full md:w-2/3">
                      <div className="h-56 rounded overflow-hidden mb-2" aria-label={`Map showing directions to ${selectedPark.name}`}>
                        {/* Dynamically import MapView or Leaflet map here, showing route from fromSelected to selectedPark */}
                        {/* Placeholder: */}
                        <iframe
                          width="100%"
                          height="220"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedPark.lon - 0.01}%2C${selectedPark.lat - 0.01}%2C${selectedPark.lon + 0.01}%2C${selectedPark.lat + 0.01}&layer=mapnik&marker=${selectedPark.lat}%2C${selectedPark.lon}`}
                        ></iframe>
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${fromSelected.lat},${fromSelected.lon}&destination=${selectedPark.lat},${selectedPark.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-movaa-primary underline text-sm"
                      >
                        Get Directions on Google Maps
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full">
                  <label htmlFor="park-search" className="block text-sm font-medium text-gray-700 mb-1">Select Take-Off Park</label>
                  <div className="flex gap-2 items-center">
                    <input
                      id="park-search"
                      className="w-full rounded-[12px] border px-3 py-2 text-[16px] font-semibold text-[#7A7A7A] focus:outline-none focus:ring-2 focus:ring-movaa-primary"
                      placeholder="Type park name or city"
                      value={parkSearch}
                      onChange={e => setParkSearch(e.target.value)}
                      aria-autocomplete="list"
                      aria-controls="park-suggestions-listbox"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="text-gray-600 hover:underline text-sm ml-2"
                      onClick={handleAutoPark}
                    >
                      Auto
                    </button>
                  </div>
                  <ul role="listbox" id="park-suggestions-listbox" className="max-h-48 overflow-y-auto mt-2 divide-y divide-gray-100 bg-white rounded shadow">
                    {parkSuggestions.length ? parkSuggestions.map((park, idx) => (
                      <li
                        key={park.name + park.lat + park.lon}
                        role="option"
                        tabIndex={0}
                        className="px-4 py-2 cursor-pointer hover:bg-movaa-primary/10 focus:bg-movaa-primary/20"
                        onClick={() => handleParkSelect(park)}
                        onKeyDown={e => { if (e.key === "Enter") handleParkSelect(park); }}
                        aria-selected={selectedPark && selectedPark.name === park.name}
                      >
                        <div className="font-semibold text-base">{park.name}</div>
                        <div className="text-xs text-gray-500">{park.address}</div>
                      </li>
                    )) : (
                      <li className="px-4 py-2 text-gray-500">No nearby parks found—please select manually.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {formError && (
            <div className="text-red-500 text-sm mb-2" role="alert">{formError}</div>
          )}

        <Button
          type="submit"
          className="w-2/3 text-center rounded-[12px] flex items-center justify-center mx-auto bg-movaa-primary hover:bg-movaa-dark text-white font-baloo text-[17px] md:text-[20px]"
          disabled={
            !!childrenError || 
            form.formState.isSubmitting ||
            (!fromSelected && !fromInput.trim()) ||
            !selectedPark?.name ||
            !form.watch("destination") ||
            !form.watch("date") ||
            !form.watch("time")
          }
        >
          {form.formState.isSubmitting ? "Processing..." : "Proceed"}
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
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-movaa-primary hover:underline"
                >
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