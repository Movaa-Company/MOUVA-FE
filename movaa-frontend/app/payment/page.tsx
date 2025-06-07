"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ACCOUNTS = [
  { name: "Folajimi Mathew", number: "98765654345" },
  { name: "Chinonso Okafor", number: "12345678901" },
  { name: "Aisha Bello", number: "23456789012" },
];
const BANK = "MONIEPOINT MICROFINANCE BANK";

const PaymentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"transfer" | "card" | "palpay">("transfer");
  const [amount, setAmount] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [account, setAccount] = useState(ACCOUNTS[0]);
  const [transferChecked, setTransferChecked] = useState(false);
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const [cardValid, setCardValid] = useState(false);
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load amount and user email
  useEffect(() => {
    let amt = 0;
    const paramAmt = searchParams.get("amount");
    if (paramAmt && !isNaN(Number(paramAmt))) {
      amt = Number(paramAmt);
    } else {
      try {
        const booking = JSON.parse(localStorage.getItem("bookingData") || "null");
        if (booking && booking.tickets) {
          // Use your pricing logic here if needed
          const price = booking.price || 40000;
          amt = price * booking.tickets;
        }
      } catch {}
    }
    setAmount(amt);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      setUserEmail(user?.email || "");
      // Pick a random account for demo
      setAccount(ACCOUNTS[Math.floor(Math.random() * ACCOUNTS.length)]);
    } catch {}
    setLoading(false);
  }, [searchParams]);

  // Card validation
  useEffect(() => {
    const luhn = (num: string) => {
      let arr = (num + "").split("").reverse().map(x => parseInt(x));
      let sum = arr.reduce((acc, val, i) => acc + (i % 2 ? ((val *= 2) > 9 ? val - 9 : val) : val), 0);
      return sum % 10 === 0;
    };
    const digits = card.number.replace(/\s/g, "");
    const validNumber = digits.length === 16 && luhn(digits);
    const validExpiry = /^\d{2}\/\d{2}$/.test(card.expiry);
    const validCVV = /^\d{3}$/.test(card.cvv);
    setCardValid(validNumber && validExpiry && validCVV);
  }, [card]);

  // Handlers
  const handleTransfer = () => {
    // Update bookingData with paymentStatus and set toast flag
    try {
      const booking = JSON.parse(localStorage.getItem("bookingData") || "null");
      if (booking) {
        booking.paymentStatus = "Paid";
        localStorage.setItem("bookingData", JSON.stringify(booking));
      }
      localStorage.setItem("showTicketToast", "true");
    } catch {}
    toast.success("Payment successful", { duration: 3000 });
    setTimeout(() => router.push("/ticket-details"), 3000);
  };
  const handleCard = () => {
    // Update bookingData with paymentStatus and set toast flag
    try {
      const booking = JSON.parse(localStorage.getItem("bookingData") || "null");
      if (booking) {
        booking.paymentStatus = "Paid";
        localStorage.setItem("bookingData", JSON.stringify(booking));
      }
      localStorage.setItem("showTicketToast", "true");
    } catch {}
    // Simulate always successful for now
    toast.success("Payment successful", { duration: 3000 });
    setTimeout(() => router.push("/ticket-details"), 3000);
    // To test error modal, setShowError(true);
  };
  const handlePalPay = () => {
    toast("Coming soon", { duration: 2000 });
  };
  const handleTryAgain = () => {
    setShowError(false);
    setCard({ number: "", expiry: "", cvv: "" });
  };
  const handleBack = () => {
    router.push("/booking-details");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col md:flex-row bg-[#F6FBF7]">
      {/* Left: Payment Methods */}
      <div className="w-full md:w-1/4 p-4 md:p-6 flex flex-row md:flex-col gap-2 md:gap-8 bg-[#F6FBF7]">
        <Button variant={tab === "transfer" ? "default" : "outline"} className="justify-start" onClick={() => setTab("transfer")}> <span className="mr-2">🛩️</span> Transfer </Button>
        <Button variant={tab === "card" ? "default" : "outline"} className="justify-start" onClick={() => setTab("card")}> <span className="mr-2">💳</span> Card </Button>
        <Button variant={tab === "palpay" ? "default" : "outline"} className="justify-start" onClick={handlePalPay} disabled> <span className="mr-2">🅿️</span> PalPay </Button>
      </div>
      {/* Right: Payment Content */}
      <div className="w-full md:flex-1 p-4 md:p-6 flex flex-col items-center">
        <div className="w-full max-w-lg box-border">
          <div className="flex justify-between items-center mb-4">
            <span className="text-2xl font-bold text-[#006400]">Movaa</span>
            <span className="text-sm text-gray-700">{userEmail}</span>
          </div>
          <div className="bg-[#7ED957] rounded-lg p-6 mb-6">
            <div className="text-lg mb-2">Amount to pay</div>
            <div className="text-3xl md:text-4xl font-bold">₦{amount.toLocaleString()}</div>
          </div>
          {tab === "transfer" && (
            <>
              <div className="text-center font-medium mb-4">Transfer to the account details below</div>
              <div className="bg-[#F1FBF4] rounded-lg p-6 mb-6 text-center">
                <div className="text-xs text-gray-700 font-semibold mb-1">{BANK}</div>
                <div className="text-2xl font-bold text-[#16A34A] mb-1 flex items-center justify-center gap-2">
                  {account.number}
                  <Button size="icon" variant="ghost" onClick={() => {navigator.clipboard.writeText(account.number); toast.success("Account number copied!");}}>
                    <span role="img" aria-label="copy">📋</span>
                  </Button>
                </div>
                <div className="text-xs text-gray-500 mb-1">Account Name</div>
                <div className="font-semibold text-lg">{account.name}</div>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <input type="checkbox" id="transfer-confirm" checked={transferChecked} onChange={e => setTransferChecked(e.target.checked)} />
                <label htmlFor="transfer-confirm" className="text-sm">I have made the transfer</label>
              </div>
              <Button className="w-full bg-movaa-primary hover:bg-movaa-dark text-white" disabled={!transferChecked} onClick={handleTransfer}>
                I've transferred the money
              </Button>
            </>
          )}
          {tab === "card" && (
            <>
              <div className="text-center font-medium mb-4">Enter Your Card Details</div>
              <form className="space-y-4" onSubmit={e => {e.preventDefault(); handleCard();}}>
                <Input
                  placeholder="Card Number"
                  value={card.number}
                  maxLength={19}
                  onChange={e => {
                    // Remove all non-digits, then insert a space every 4 digits
                    let value = e.target.value.replace(/\D/g, "").slice(0, 16);
                    value = value.replace(/(.{4})/g, "$1 ").trim();
                    setCard({ ...card, number: value });
                  }}
                  className="text-lg"
                />
                <div className="flex gap-4">
                  <Input
                    placeholder="Expiry Date"
                    value={card.expiry}
                    maxLength={5}
                    onChange={e => {
                      let value = e.target.value.replace(/\D/g, "").slice(0, 4);
                      if (value.length > 2) value = value.slice(0, 2) + "/" + value.slice(2);
                      setCard({ ...card, expiry: value });
                    }}
                    className="text-lg"
                  />
                  <Input
                    placeholder="CVV"
                    value={card.cvv}
                    maxLength={3}
                    onChange={e => setCard({ ...card, cvv: e.target.value.replace(/[^\d]/g, "") })}
                    className="text-lg"
                  />
                </div>
                <Button className="w-full bg-movaa-primary hover:bg-movaa-dark text-white" type="submit" disabled={!cardValid}>
                  Continue
                </Button>
              </form>
            </>
          )}
          {tab === "palpay" && (
            <div className="text-center font-medium mt-8">PalPay integration coming soon.</div>
          )}
        </div>
        {/* Error Modal */}
        {showError && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center">
              <div className="text-2xl font-bold text-red-600 mb-4">Payment was not successful</div>
              <div className="mb-6">Please try again</div>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={handleBack}>Back</Button>
                <Button className="bg-movaa-primary hover:bg-movaa-dark text-white" onClick={handleTryAgain}>Try again</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage; 