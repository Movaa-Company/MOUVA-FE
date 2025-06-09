'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Helper: Generate cryptographically-strong 6-char alphanumeric code
function generateTicketCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint32Array(6);
  window.crypto.getRandomValues(array);
  return Array.from(array, (x) => chars[x % chars.length]).join('');
}

function sanitize(str: string) {
  // Basic sanitization for display
  return String(str || '').replace(/[<>]/g, '');
}

const TicketDetailsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [ticketCode, setTicketCode] = useState('');
  const ticketRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Show toast if coming from payment
  useEffect(() => {
    // Use localStorage flag (set in payment page before routing)
    if (typeof window !== 'undefined' && localStorage.getItem('showTicketToast') === 'true') {
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        localStorage.removeItem('showTicketToast');
      }, 3000);
    }
  }, []);

  // Load data and ensure ticket code is persisted
  useEffect(() => {
    try {
      const bookingRaw = localStorage.getItem('bookingData');
      const userRaw = localStorage.getItem('user');
      if (!bookingRaw || !userRaw) {
        setError('Booking or user data missing. Please return to booking.');
        return;
      }
      const bookingObj = JSON.parse(bookingRaw);
      const userObj = JSON.parse(userRaw);
      // Ticket code: persist if missing
      let code = bookingObj.ticketCode;
      if (!code || typeof code !== 'string' || code.length !== 6) {
        code = generateTicketCode();
        bookingObj.ticketCode = code;
        localStorage.setItem('bookingData', JSON.stringify(bookingObj));
      }
      setBooking(bookingObj);
      setUser(userObj);
      setTicketCode(code);
    } catch (e) {
      setError('Error loading ticket data. Please try again.');
    }
  }, []);

  // PDF Download
  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    const html2pdf = (await import('html2pdf.js'))?.default || (await import('html2pdf.js'));
    html2pdf()
      .from(ticketRef.current)
      .set({
        margin: 0,
        filename: `ticket-${ticketCode}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { format: 'a4' },
      })
      .save()
      .then(() => setDownloading(false));
  };

  // Print
  const handlePrint = () => {
    if (!ticketRef.current) return;
    window.print();
  };

  // Copy helpers
  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    toast.success('Copied!');
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="mb-4">{error}</p>
        <Button onClick={() => (window.location.href = '/booking-details')}>
          Go Back to Booking
        </Button>
      </div>
    );
  }
  if (!booking || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Data extraction and sanitization
  const fullName = sanitize(user.profile?.firstName + ' ' + user.profile?.lastName);
  const phone = sanitize(user.phone || '');
  const nextOfKinName = sanitize(user.profile?.nextOfKinName || '');
  const nextOfKinPhone = sanitize(user.profile?.nextOfKinPhone || '');
  const fromCity = sanitize(booking.from || '');
  const toCity = sanitize(booking.destination || '');
  const takeOffPark = sanitize(booking.takeOffPark || '');
  // Calculate amount paid using price * tickets (fallback to 40000 if price not present)
  const price = booking.price || 40000;
  const numTickets = booking.tickets || 1;
  const amountPaid = `₦${(price * numTickets).toLocaleString()}`;
  // Use ticketCode from state
  const dateStr = booking.date
    ? new Date(booking.date).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-';
  const timeStr = booking.time || '';
  const paymentStatus = booking.paymentStatus || '-';

  // Navbar
  //   const Navbar = () => (
  //     <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 flex items-center justify-between px-10 py-2 mb-4">
  //       <Link href="/" className="text-2xl font-bold text-movaa-primary hover:underline" aria-label="Go to home">Movaa</Link>
  //       <div className="flex gap-2">
  //         <Link href="/sign-in"><Button variant="outline" className="text-movaa-primary border-movaa-primary">Log In</Button></Link>
  //         <Link href="/signup"><Button className="bg-movaa-primary text-white">Sign Up</Button></Link>
  //       </div>
  //     </nav>
  //   );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-6 pb-2 px-2 md:px-0">
      {/* <Navbar /> */}
      {/* Toast for success message */}
      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-700 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          Here&apos;s your ticket. Please keep it safe
        </div>
      )}
      <div className="w-full max-w-3xl">
        {/* Header Bar */}
        <div className="rounded-t-2xl bg-gradient-to-r from-green-800 to-green-600 text-white px-6 py-4 text-2xl font-bold mb-0 md:mb-2 print:bg-green-800 print:text-white">
          Ticket Details
        </div>
        {/* Ticket Section (printable) */}
        <div
          ref={ticketRef}
          className="ticket-section bg-white rounded-b-2xl shadow-md px-4 md:px-8 py-6 print:rounded-none print:shadow-none"
        >
          {/* Passenger Details */}
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">Passenger Details</h2>
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <div className="text-gray-700">Full Name:</div>
              <div className="font-medium flex items-center gap-2">{fullName}</div>
              <div className="text-gray-700">Phone Number</div>
              <div className="font-medium flex items-center gap-2">{phone}</div>
            </div>
          </section>
          <hr className="my-4 border-dashed border-gray-300" />
          {/* Next of Kin */}
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">Next Of Kin</h2>
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <div className="text-gray-700">Full Name:</div>
              <div className="font-medium flex items-center gap-2">{nextOfKinName}</div>
              <div className="text-gray-700">Phone Number</div>
              <div className="font-medium flex items-center gap-2">{nextOfKinPhone}</div>
            </div>
          </section>
          <hr className="my-4 border-dashed border-gray-300" />
          {/* Departure Details */}
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">Departure Details</h2>
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <div>Passengers</div>
              <div className="font-medium">
                {numTickets} Adult{numTickets > 1 ? 's' : ''}
              </div>
              <div>Amount Paid</div>
              <div className="font-medium">{amountPaid}</div>
              <div>Payment Status</div>
              <div className="font-medium">{paymentStatus}</div>
              <div>Ticket Code</div>
              <div className="font-mono font-bold flex items-center gap-2">
                {ticketCode}
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Copy ticket code"
                  onClick={() => handleCopy(ticketCode)}
                >
                  <span role="img" aria-label="copy">
                    📋
                  </span>
                </Button>
              </div>
              <div>From (Departure City)</div>
              <div className="font-medium">{fromCity}</div>
              <div>To (Destination City)</div>
              <div className="font-medium">{toCity}</div>
              <div>Date/Time</div>
              <div className="font-medium">
                {dateStr}
                {timeStr && `, ${timeStr}`}
              </div>
              <div>Take Off Park</div>
              <div className="font-medium">{takeOffPark}</div>
            </div>
          </section>
          {/* Done Button */}
          <div className="flex justify-end mt-8">
            <Button
              onClick={() => router.push('/')}
              aria-label="Done"
              className="bg-movaa-primary hover:bg-movaa-dark text-white px-8 py-2 rounded-lg"
            >
              Done
            </Button>
          </div>
        </div>
        {/* Footer: Download/Print */}
        <div className="flex flex-col md:flex-row gap-4 justify-end mt-6 print:hidden">
          <Button
            onClick={handleDownload}
            aria-label="Download ticket as PDF"
            disabled={downloading}
            className="bg-movaa-primary hover:bg-movaa-dark text-white"
          >
            {downloading ? 'Downloading...' : 'Download'}
          </Button>
          <Button
            onClick={handlePrint}
            aria-label="Print ticket"
            className="bg-movaa-primary hover:bg-movaa-dark text-white"
          >
            Print
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsPage;
