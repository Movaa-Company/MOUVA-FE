"use client";

import { useState, useEffect } from "react";
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

const formSchema = z.object({
  destination: z.string().min(2, { message: "Destination city is required" }),
  from: z.string().min(2, { message: "Departure city is required" }),
  date: z.date({ required_error: "Travel date is required" }),
  time: z.string({ required_error: "Pick-up time is required" }),
  tickets: z.number().min(1, { message: "No. of ticket is required" }),
  children: z.number().max(20).optional(),
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
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [childrenError, setChildrenError] = useState<string | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: "",
      from: currentCity || "",
      date: undefined,
      time: "",
      tickets: 1,
      children: 0,
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
  const handleFromInput = debounce(async (value: string) => {
    setFromSuggestions(await fetchNigerianCities(value));
  }, 300);

  // Children validation
  const validateChildren = (children: number, tickets: number) => {
    if (children > tickets) {
      setChildrenError("Only one child per ticket booked is allowed. Please select more ticket(s).");
      return false;
    }
    setChildrenError(null);
    return true;
  };

  const onSubmit = (data: BookingFormValues) => {
    if (!validateChildren(data.children ?? 0, data.tickets)) {
      return;
    }
    if (isLoggedIn) {
      toast.success("Proceeding to payment...");
      router.push("/payment");
    } else {
      setOpenAuthDialog(true);
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
          <FormField
            control={form.control}
            name="from"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={visuallyHidden}>From</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="From"
                      className="rounded-[12px] font-semibold text-[16px] text-[#7A7A7A]"
                      {...field}
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFromInput(e.target.value);
                      }}
                      autoComplete="off"
                    />
                    {fromSuggestions.length > 0 && (
                      <ul className="absolute z-10 bg-white border rounded w-full mt-1 max-h-40 overflow-y-auto">
                        {fromSuggestions.map((city) => (
                          <li
                            key={city}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              form.setValue("from", city);
                              setFromSuggestions([]);
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

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <FormLabel className={visuallyHidden}>Pick Time</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-[12px] text-[#7A7A7A] font-semibold text-[16px]">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                    </FormControl>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <FormControl>
                      <SelectTrigger className="rounded-[12px] text-[#7A7A7A] font-semibold text-[16px]">
                        <SelectValue placeholder="No. of Ticket" />
                      </SelectTrigger>
                    </FormControl>
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
                      <FormControl>
                        <SelectTrigger className="rounded-[12px] text-[#7A7A7A] font-semibold text-[16px]">
                          <SelectValue placeholder="Children?" />
                        </SelectTrigger>
                      </FormControl>
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

          <Button
            type="submit"
            className="w-2/3 text-center rounded-[12px] flex items-center justify-center mx-auto bg-movaa-primary hover:bg-movaa-dark text-white font-baloo text-[17px] md:text-[20px]"
            disabled={!!childrenError}
          >
            Proceed
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
