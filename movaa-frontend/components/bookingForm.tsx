"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calender";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  destination: z.string().min(2, { message: "Destination city is required" }),
  from: z.string().min(2, { message: "Departure city is required" }),
  date: z.date({ required_error: "Travel date is required" }),
  time: z.string({ required_error: "Pick-up time is required" }),
  forWho: z.string({ required_error: "Please specify who this booking is for" }),
  numberOfPeople: z.number().optional(),
});

type BookingFormValues = z.infer<typeof formSchema>;

interface BookingFormProps {
  onDestinationChange: (destination: string) => void;
}

const BookingForm = ({ onDestinationChange }: BookingFormProps) => {
  const router = useRouter();
  const [isLoggedIn] = useState(false); // Replace with actual authentication logic
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const [showOthersCount, setShowOthersCount] = useState(false);

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
    if (isLoggedIn) {
      toast.success("Proceeding to payment...");
      router.push("/payment");
    } else {
      setOpenAuthDialog(true);
    }
  };

  return (
    <div className="booking-form">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Travelling to</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter destination city"
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

          <FormField
            control={form.control}
            name="from"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From</FormLabel>
                <FormControl>
                  <Input placeholder="Enter departure city" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className="w-full pl-3 text-left font-normal flex justify-between">
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span className="text-muted-foreground">Pick a date</span>
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

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pick Time</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pick-up time" />
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

              <FormField
                control={form.control}
                name="forWho"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>For Who?</FormLabel>
                    <Select onValueChange={(value) => handleForWhoChange(value)} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select who this is for" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="for-me">For me</SelectItem>
                        <SelectItem value="for-others">For others</SelectItem>
                        <SelectItem value="for-me-and-others">For me and others</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {showOthersCount && (
            <FormField
              control={form.control}
              name="numberOfPeople"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of People</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString() || "1"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of people" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" className="w-full bg-movaa-primary hover:bg-movaa-dark text-white">
            Proceed to Payment
          </Button>
        </form>
      </Form>

      <Dialog open={openAuthDialog} onOpenChange={setOpenAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogDescription>You need to be signed in to proceed with the booking.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="text-movaa-primary hover:underline">
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
