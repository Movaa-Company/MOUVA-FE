"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PersonalizeProfileForm from "../signup/onboarding/page";
import { useToast } from "@/hooks/use-toast";
import { redirect } from "next/navigation";

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [userData, setUserData] = useState<{
    contactValue: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    // Get stored user data
    const storedData = localStorage.getItem("movaaUserData");

    if (!storedData) {
      toast.error("Please complete signup first");
      redirect("/signup");
      return;
    }

    try {
      const parsedData = JSON.parse(storedData);
      setUserData(parsedData);
    } catch (error) {
      toast.error("Error loading user data");
      redirect("/signup");
    }
  }, [toast]);

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <PersonalizeProfileForm
      contactValue={userData.contactValue}
      password={userData.password}
    />
  );
}
