"use client";

import { useState } from "react";
import Link from "next/link";
import BookingForm from "@/components/bookingForm";
import MapView from "@/components/mapView";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const BookingPage = () => {
  const isMobile = useIsMobile();
  const [destination, setDestination] = useState("");

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between p-4 border-b border-gray-200">
        <h1 className="text-2xl font-baloo font-semibold text-movaa-primary">
          Movaa
        </h1>
        {isMobile ? <MobileNav /> : <DesktopNav />}
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 py-4 px-1 md:py-8">
          <div className="mb-5 text-center">
            <h1 className="text-[20px] md:text-3xl font-baloo font-semibold text-black mb-2">
              Book bus ticket to any city
            </h1>
          </div>

          <Tabs defaultValue="book-ticket" className="w-full ">
            <TabsList className="w-full mb-6 py-[30px] px-[30px] flex gap-2 bg-white/60 border-t rounded-[12px]">
              <TabsTrigger
                value="book-ticket"
                className="flex-1 rounded-[22px] border data-[state=active]:bg-movaa-primary data-[state=active]:text-white"
              >
                Book Ticket
              </TabsTrigger>
              <TabsTrigger
                value="check-ticket"
                className="flex-1 rounded-[22px] border data-[state=active]:bg-movaa-primary data-[state=active]:text-white"
                disabled
                title="No live tickets, please book a ticket first"
              >
                Check Ticket
              </TabsTrigger>
              <TabsTrigger
                value="charter-bus"
                className="flex-1 rounded-[22px] border data-[state=active]:bg-movaa-primary data-[state=active]:text-white"
              >
                Charter Bus
              </TabsTrigger>
            </TabsList>

            <TabsContent value="book-ticket">
              <BookingForm onDestinationChange={setDestination} />
            </TabsContent>
            <TabsContent value="check-ticket">
              <div className="text-center p-6">
                <p>No live tickets available. Please book a ticket first.</p>
              </div>
            </TabsContent>
            <TabsContent value="charter-bus">
              <div className="text-center p-6">
                <p>Charter bus booking coming soon.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {!isMobile && (
          <div className="hidden md:block w-1/2 max-h-screen bg-gray-100">
            <MapView destination={destination} />
          </div>
        )}
      </div>
    </div>
  );
};

const DesktopNav = () => (
  <div className="flex items-center space-x-8">
    <div className="flex space-x-6">
      <Link
        href="/"
        className="text-gray-700 hover:text-movaa-primary transition-colors"
      >
        Home
      </Link>
      <Link
        href="#"
        className="text-gray-700 hover:text-movaa-primary transition-colors"
      >
        About
      </Link>
      <Link
        href="#"
        className="text-gray-700 hover:text-movaa-primary transition-colors"
      >
        Contact
      </Link>
    </div>
    <div className="flex space-x-4">
      <Button asChild variant="outline">
        <Link href="/sign-in">Sign In</Link>
      </Button>
      <Button asChild>
        <Link href="/signup">Sign Up</Link>
      </Button>
    </div>
  </div>
);

const MobileNav = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon">
        <Menu className="h-5 w-5" />
      </Button>
    </SheetTrigger>
    <SheetContent>
      <div className="flex flex-col space-y-4 mt-8">
        <Link
          href="/"
          className="text-lg text-gray-700 hover:text-movaa-primary py-2 transition-colors"
        >
          Home
        </Link>
        <Link
          href="#"
          className="text-lg text-gray-700 hover:text-movaa-primary py-2 transition-colors"
        >
          About
        </Link>
        <Link
          href="#"
          className="text-lg text-gray-700 hover:text-movaa-primary py-2 transition-colors"
        >
          Contact
        </Link>
        <div className="pt-4 flex flex-col space-y-3">
          <Button asChild variant="outline" className="w-full">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild className="w-full">
            <Link href="/">Sign Up</Link>
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

export default BookingPage;
