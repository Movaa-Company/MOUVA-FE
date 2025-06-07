"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBookingData, getUser, saveUser, saveBookingData } from "@/lib/localStorageUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// Dynamically import Leaflet map to avoid SSR issues
const MapView = dynamic(() => import("@/components/mapView"), { ssr: false });

// Pricing function (city pair based)
const getTicketPrice = (from: string, to: string) => {
  const key = `${from.trim().toLowerCase()}-${to.trim().toLowerCase()}`;
  const priceTable: { [key: string]: number } = {
    "ajah-aba": 40000,
    "ikeja-aba": 42000,
    "yaba-aba": 41000,
    // Add more city pairs as needed
  };
  return priceTable[key] || 40000; // default price
};

// Haversine formula for distance (km)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const BookingDetailsPage = () => {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const bookingData = getBookingData();
    const userData = getUser();
    if (!bookingData || !userData) {
      router.replace("/bookingForm");
      return;
    }
    setBooking(bookingData);
    setUser(userData);
    setLoading(false);
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }
  if (!booking || !user) {
    return null;
  }

  // Extract details
  const fromDetails = booking.fromDetails || {};
  const park = booking.takeOffPark || {};
  const price = getTicketPrice(booking.from, booking.destination);
  const total = price * (booking.tickets || 1);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Booking Details</h1>
      <div className="bg-gray-50 rounded-xl shadow p-4 md:p-8 mb-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Trip Details */}
          <div>
            <h2 className="font-semibold text-lg bg-gray-100 rounded-t px-3 py-2 mb-2">Trip Details</h2>
            <div className="space-y-2 text-sm md:text-base">
              <div className="flex justify-between"><span>Traveling To:</span> <span className="font-bold">{booking.destination}</span></div>
              <div className="flex justify-between"><span>From:</span> <span className="font-bold">{booking.from}</span></div>
              <div className="flex justify-between"><span>Street:</span> <span className="font-bold">{fromDetails.street || '-'}</span></div>
              <div className="flex justify-between"><span>Date/Time:</span> <span className="font-bold">{booking.date ? new Date(booking.date).toLocaleString() : "-"} {booking.time}</span></div>
              <div className="flex justify-between"><span>Passenger:</span> <span>👤 Adult: {booking.tickets} 👶 Children: {booking.children || 0}</span></div>
            </div>
          </div>
          {/* Passenger Details */}
          <div>
            <h2 className="font-semibold text-lg bg-gray-100 rounded-t px-3 py-2 mb-2">Passenger Details</h2>
            <div className="space-y-2 text-sm md:text-base">
              <div className="flex justify-between"><span>Full Name:</span> <span className="font-bold">{user.profile?.firstName} {user.profile?.lastName}</span></div>
              <div className="flex justify-between"><span>Phone Number:</span> <span className="font-bold">{user.phone}</span></div>
              <div className="flex justify-between"><span>Email:</span> <span className="font-bold">{user.email}</span></div>
            </div>
          </div>
        </div>
        {/* Next of Kin & Payment */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <h2 className="font-semibold text-lg bg-gray-100 rounded-t px-3 py-2 mb-2">Next of Kin</h2>
            <div className="space-y-2 text-sm md:text-base">
              <div className="flex justify-between"><span>Full Name:</span> <span className="font-bold">{user.profile?.nextOfKinName}</span></div>
              <div className="flex justify-between"><span>Phone Number:</span> <span className="font-bold">{user.profile?.nextOfKinPhone}</span></div>
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-lg bg-gray-100 rounded-t px-3 py-2 mb-2">Payment Summary</h2>
            <div className="space-y-2 text-sm md:text-base">
              <div className="flex justify-between"><span>Ticket Price:</span> <span>₦{price.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Adult X{booking.tickets}:</span> <span>₦{total.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total Payment:</span> <span>₦{total.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
        {/* Take-Off Park & Map */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <h2 className="font-semibold text-lg bg-gray-100 rounded-t px-3 py-2 mb-2">Take-Off Park</h2>
            <div className="space-y-2 text-sm md:text-base">
              <div className="font-bold">{park.name}</div>
              <div>{park.address}</div>
              <div className="text-xs text-gray-500">{park.city}</div>
            </div>
          </div>
          <div>
            {fromDetails.lat && fromDetails.lon && park.lat && park.lon && (
              <MapView
                userCoords={{ lat: Number(fromDetails.lat), lng: Number(fromDetails.lon) }}
                terminalCoords={{ lat: Number(park.lat), lng: Number(park.lon) }}
                terminalName={park.name}
              />
            )}
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 mt-8 justify-center">
          <Button variant="outline" className="w-full md:w-auto" onClick={() => router.push("/bookingForm")}>Edit Details</Button>
          <Button className="w-full md:w-auto bg-movaa-primary hover:bg-movaa-dark text-white" onClick={() => router.push("/payment")}>Proceed to Payment</Button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage; 