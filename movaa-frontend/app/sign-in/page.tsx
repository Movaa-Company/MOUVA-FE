"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import SignInLayout from "./signinLayout";
import Link from "next/link";

const SignInForm = () => {
  const router = useRouter();
  const [contactValue, setContactValue] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Handle contact input validation
  const validateContact = () => {
    if (!contactValue) {
      setErrors({ contact: "Please enter your email or phone number" });
      return false;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue);
    const isPhone = /^\+?[0-9]{10,15}$/.test(contactValue);

    if (!isEmail && !isPhone) {
      setErrors({ contact: "Please enter a valid email or phone number" });
      return false;
    }

    setErrors((prev) => ({ ...prev, contact: "" }));
    return true;
  };

  // Handle password validation
  const validatePassword = () => {
    if (!password) {
      setErrors({ password: "Please enter your password" });
      return false;
    }

    setErrors((prev) => ({ ...prev, password: "" }));
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      if (!validateContact() || !validatePassword()) {
        return;
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Welcome back to Movaa!");
      router.push("/dashboard"); // or wherever you want to redirect
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Invalid credentials. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-semibold font-baloo text-black mb-3">
          Sign in
        </h1>
        <p className="text-gray-600 text-xs">
          sign in & book your bus in seconds
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <input
            id="contact"
            type="text"
            value={contactValue}
            onChange={(e) => setContactValue(e.target.value)}
            onBlur={validateContact}
            className="input-animated w-full px-4 py-3 bg-gray-50 rounded-lg"
            placeholder="Enter your email or phone number"
            aria-label="Email or Phone Number"
            disabled={isSubmitting}
          />
          {errors.contact && (
            <p className="text-red-500 text-sm">{errors.contact}</p>
          )}
        </div>

        <div className="space-y-2">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={validatePassword}
            className="input-animated w-full px-4 py-3 bg-gray-50 rounded-lg"
            placeholder="Enter your password"
            aria-label="password"
            disabled={isSubmitting}
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}
        </div>

        <div className="text-right">
          <button
            type="button"
            className="text-movaa-primary hover:underline text-sm"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-hover-effect w-full bg-movaa-primary hover:bg-movaa-light text-white py-3 rounded-lg flex items-center justify-center"
        >
          {isSubmitting ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              Sign In <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </button>

        <div className="text-center mt-4">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <Link href="/signup" className="text-movaa-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default function SignInPage() {
  return <SignInLayout SignInForm={SignInForm} />;
}
