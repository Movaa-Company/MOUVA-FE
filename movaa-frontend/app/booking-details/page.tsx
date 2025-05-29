"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBookingData, getUser, saveUser, saveBookingData } from "@/lib/localStorageUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// Dynamically import Leaflet map to avoid SSR issues
const MapView = dynamic(() => import("@/components/mapView"), { ssr: false });

// Sample terminal data (city, name, coordinates)
const TERMINALS = [
  { city: "Ajah", name: "Ajah Motor Pack", lat: 6.4682, lng: 3.5852, address: "No 1. Tinubu Avenue, Ajah Bustop" },
  { city: "Ikeja", name: "Ikeja Bus Terminal", lat: 6.6018, lng: 3.3515, address: "Obafemi Awolowo Way, Ikeja" },
  { city: "Yaba", name: "Yaba Bus Terminal", lat: 6.5095, lng: 3.3715, address: "Murtala Muhammed Way, Yaba" },
  // Add more as needed
];

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
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState<any>({});
  const [nextOfKin, setNextOfKin] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load data on mount
  useEffect(() => {
    const bookingData = getBookingData();
    const userData = getUser();
    if (!bookingData || !userData) {
      router.replace("/bookingForm");
      return;
    }
    setBooking(bookingData);
    setUser(userData);
    setProfile({
      fullName: userData.profile?.firstName + " " + userData.profile?.lastName,
      phone: userData.phone || "",
      gender: userData.profile?.gender || "",
      email: userData.email || "",
    });
    setNextOfKin({
      name: userData.profile?.nextOfKinName || "",
      phone: userData.profile?.nextOfKinPhone || "",
      gender: userData.profile?.nextOfKinGender || "",
    });
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

  // Find nearest terminal
  const fromCity = booking && booking.from ? booking.from.split("(")[0].trim() : "";
  const terminal = TERMINALS.find(t => t.city.toLowerCase() === fromCity.toLowerCase()) || TERMINALS[0];
  // For demo, fake user location as terminal location
  const userLat = terminal.lat, userLng = terminal.lng;
  const terminalLat = terminal.lat, terminalLng = terminal.lng;
  const distance = getDistance(userLat, userLng, terminalLat, terminalLng);

  // Payment calculation
  const price = getTicketPrice(fromCity, booking && booking.destination ? booking.destination.split("(")[0].trim() : "");
  const total = price * (booking && booking.tickets ? booking.tickets : 1);

  // Edit handlers
  const handleEdit = () => setEditMode(true);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    section: string,
    field: string
  ) => {
    if (section === "profile") setProfile({ ...profile, [field]: e.target.value });
    if (section === "nextOfKin") setNextOfKin({ ...nextOfKin, [field]: e.target.value });
  };
  const handleSave = () => {
    // Save edits to localStorage
    const updatedUser = {
      ...user,
      profile: {
        ...user.profile,
        firstName: profile.fullName.split(" ")[0] || "",
        lastName: profile.fullName.split(" ")[1] || "",
        gender: profile.gender,
        nextOfKinName: nextOfKin.name,
        nextOfKinPhone: nextOfKin.phone,
        nextOfKinGender: nextOfKin.gender,
      },
      phone: profile.phone,
      email: profile.email,
    };
    saveUser(updatedUser);
    setUser(updatedUser);
    setEditMode(false);
    // Optionally, update booking data if needed
    saveBookingData(booking);
    router.push("/payment");
  };

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
              <div className="flex justify-between"><span>Date/Time:</span> <span className="font-bold">{booking.date ? new Date(booking.date).toLocaleString() : "-"}</span></div>
              <div className="flex justify-between"><span>Passenger:</span> <span>👤 Adult: {booking.tickets} 👶 Children: {booking.children || 0}</span></div>
              <div className="flex justify-between"><span>Seat No:</span> <span>🚌 13 seats available <Button size="sm" variant="outline" className="ml-2">View Seat</Button></span></div>
            </div>
          </div>
          {/* Passenger Details */}
          <div>
            <h2 className="font-semibold text-lg bg-gray-100 rounded-t px-3 py-2 mb-2">Passenger Details</h2>
            <div className="space-y-2 text-sm md:text-base">
              <div className="flex justify-between"><span>Full Name:</span> {editMode ? <Input value={profile.fullName} onChange={e => handleChange(e, "profile", "fullName")} /> : <span className="font-bold">{profile.fullName}</span>}</div>
              <div className="flex justify-between"><span>Phone Number:</span> {editMode ? <Input value={profile.phone} onChange={e => handleChange(e, "profile", "phone")} /> : <span className="font-bold">{profile.phone}</span>}</div>
              <div className="flex justify-between"><span>Email:</span> {editMode ? <Input value={profile.email} onChange={e => handleChange(e, "profile", "email")} /> : <span className="font-bold">{profile.email}</span>}</div>
            </div>
          </div>
        </div>
        {/* Next of Kin & Payment */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <h2 className="font-semibold text-lg bg-gray-100 rounded-t px-3 py-2 mb-2">Next Kin</h2>
            <div className="space-y-2 text-sm md:text-base">
              <div className="flex justify-between"><span>Full Name:</span> {editMode ? <Input value={nextOfKin.name} onChange={e => handleChange(e, "nextOfKin", "name")} /> : <span className="font-bold">{nextOfKin.name}</span>}</div>
              <div className="flex justify-between"><span>Phone Number:</span> {editMode ? <Input value={nextOfKin.phone} onChange={e => handleChange(e, "nextOfKin", "phone")} /> : <span className="font-bold">{nextOfKin.phone}</span>}</div>
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-lg bg-gray-100 rounded-t px-3 py-2 mb-2">Payment Summary</h2>
            <div className="space-y-2 text-sm md:text-base">
              <div className="flex justify-between"><span>Departure:</span> <span>₦{price.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Adult X{booking.tickets}:</span> <span>₦{total.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total Payment:</span> <span>₦{total.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
        {/* Nearest Park & Map */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <h2 className="font-semibold text-lg bg-gray-100 rounded-t px-3 py-2 mb-2">Nearest Park</h2>
            <div className="space-y-2 text-sm md:text-base">
              <div className="font-bold">{terminal.name}</div>
              <div>{terminal.address}</div>
              <div className="text-xs text-gray-500">Ajah pack is {Math.round(distance * 60)}mins to your location</div>
            </div>
          </div>
          <div>
            <MapView
              userCoords={{ lat: userLat, lng: userLng }}
              terminalCoords={{ lat: terminalLat, lng: terminalLng }}
              terminalName={terminal.name}
            />
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 mt-8 justify-center">
          {!editMode ? (
            <>
              <Button variant="outline" className="w-full md:w-auto" onClick={handleEdit}>Edit Details</Button>
              <Button className="w-full md:w-auto bg-movaa-primary hover:bg-movaa-dark text-white" onClick={handleSave}>Make Payment</Button>
            </>
          ) : (
            <Button className="w-full md:w-auto bg-movaa-primary hover:bg-movaa-dark text-white" onClick={handleSave}>Make Payment</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage; 