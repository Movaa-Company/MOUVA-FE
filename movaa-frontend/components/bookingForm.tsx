"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  DialogTrigger,
  DialogFooter,
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
import Link from "next/link"; // Next.js Link component
import { toast } from "sonner";
import React from "react";

const visuallyHidden = "sr-only"; // or "absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden clip-[rect(0,0,0,0)] whitespace-nowrap border-0"

const formSchema = z.object({
  destination: z.string().min(2, {
    message: "Destination city is required",
  }),
  from: z.string().min(2, {
    message: "Departure city is required",
  }),
  date: z.date({
    required_error: "Travel date is required",
  }),
  time: z.string({
    required_error: "Pick-up time is required",
  }),
  forWho: z.string({
    required_error: "Please specify who this booking is for",
  }),
  numberOfPeople: z.number().optional(),
  children: z.number().optional(),
});

type BookingFormValues = z.infer<typeof formSchema>;

interface BookingFormProps {
  onDestinationChange: (destination: string) => void;
}

const BookingForm = ({ onDestinationChange }: BookingFormProps) => {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const [showOthersCount, setShowOthersCount] = useState(false);

  const otpRefs = [
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
  ];

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: "",
      from: "",
      date: undefined,
      time: "",
      forWho: "for-me",
      numberOfPeople: 1,
    },
  });

  // Check if user is logged in

  useEffect(() => {
    if (typeof window !== "undefined") {
      const authToken = localStorage.getItem("movaaAuthToken");
      setIsLoggedIn(!!authToken);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("destination", value);
    onDestinationChange(value);
  };

  const handleForWhoChange = (value: string) => {
    form.setValue("forWho", value);
    setShowOthersCount(value !== "for-me");
  };

  const onSubmit = (data: BookingFormValues) => {
    console.log("Form data:", data);

    // Save booking data to localStorage for retrieval on trip details page
    localStorage.setItem("movaaBookingData", JSON.stringify(data));

    if (isLoggedIn) {
      // Navigate to trip details screen using Next.js router
      toast.success("Proceeding to trip details...");
      router.push("/trip-details");
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
                  <Input
                    placeholder="Travelling to"
                    className="rounded-[12px] font-semibold text-[18px] text-[#7A7A7A]"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleDestinationChange(e);
                    }}
                  />
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
                  <Input
                    placeholder="From"
                    className="rounded-[12px] font-semibold text-[16px] text-[#7A7A7A]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          {/* For Who and Children Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - For Who */}
            <div>
              <div className={showOthersCount ? "flex gap-4" : ""}>
                <div className={showOthersCount ? "w-1/2" : "w-full"}>
                  <FormField
                    control={form.control}
                    name="forWho"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={visuallyHidden}>
                          For Who?
                        </FormLabel>
                        <Select
                          onValueChange={(value) => handleForWhoChange(value)}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-[12px] text-[#7A7A7A] font-semibold text-[16px]">
                              <SelectValue placeholder="For who?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="font-semibold">
                            <SelectItem value="for-me">For me</SelectItem>
                            <SelectItem value="for-me-and-others">
                              For me and others
                            </SelectItem>
                            <SelectItem value="for-others">
                              For others
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {showOthersCount && (
                  <div className="w-1/2">
                    <FormField
                      control={form.control}
                      name="numberOfPeople"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={visuallyHidden}>
                            Number of People
                          </FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            defaultValue={field.value?.toString() || "1"}
                          >
                            <FormControl>
                              <SelectTrigger className="rounded-[12px] text-[#7A7A7A] font-semibold text-[16px]">
                                <SelectValue placeholder="Number of people" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 10 }, (_, i) => i + 1).map(
                                (num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num} {num === 1 ? "person" : "people"}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Children */}
            <FormField
              control={form.control}
              name="children"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={visuallyHidden}>Children?</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-[12px] text-[#7A7A7A] font-semibold text-[16px]">
                        <SelectValue placeholder="Children?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num <= 1 ? "child" : "children"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-2/3 text-center rounded-[12px] flex items-center justify-center mx-auto bg-movaa-primary hover:bg-movaa-dark text-white font-baloo text-[17px] md:text-[20px]"
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
