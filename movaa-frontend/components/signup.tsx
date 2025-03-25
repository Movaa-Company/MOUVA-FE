"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useToast } from "../hooks/use-toast";

type FormStage = "contact" | "otp" | "password";

const SignUpForm = () => {
  const [stage, setStage] = useState<FormStage>("contact");
  const [contactValue, setContactValue] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // OTP input refs
  const otpRefs = [
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
  ];

  // Animation classes based on direction
  const getAnimationClasses = (currentStage: FormStage) => {
    if (currentStage === stage) {
      return direction === "forward"
        ? "screen-enter screen-enter-right"
        : "screen-enter screen-enter-left";
    }
    return direction === "forward"
      ? "screen-exit screen-exit-left"
      : "screen-exit screen-exit-right";
  };

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

    setErrors({});
    return true;
  };

  // Handle OTP validation
  const validateOtp = () => {
    if (otp.some((digit) => digit === "")) {
      setErrors({ otp: "Please enter the complete verification code" });
      return false;
    }
    setErrors({});
    return true;
  };

  // Handle password validation
  const validatePassword = () => {
    if (password.length < 8) {
      setErrors({ password: "Password must be at least 8 characters" });
      return false;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return false;
    }

    setErrors({});
    return true;
  };

  // Handle form submission for each stage
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let isValid = false;

    switch (stage) {
      case "contact":
        isValid = validateContact();
        if (isValid) {
          // Simulate API call to send OTP
          setTimeout(() => {
            setDirection("forward");
            setStage("otp");
            toast.success(`Verification code sent to ${contactValue}`);
          }, 1000);
        }
        break;

      case "otp":
        isValid = validateOtp();
        if (isValid) {
          // Simulate OTP verification
          setTimeout(() => {
            setDirection("forward");
            setStage("password");
          }, 1000);
        }
        break;

      case "password":
        isValid = validatePassword();
        if (isValid) {
          // Simulate final registration
          setTimeout(() => {
            toast.success("Registration completed successfully!");
          }, 1000);
        }
        break;
    }

    setIsSubmitting(false);
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.charAt(0);
    }

    if (value.match(/^[0-9]$/)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value !== "" && index < 3) {
        otpRefs[index + 1].current?.focus();
      }
    } else if (value === "") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  // Handle OTP keydown for backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && index > 0 && otp[index] === "") {
      otpRefs[index - 1].current?.focus();
    }
  };

  // Handle going back to previous stage
  const handleBack = () => {
    setDirection("backward");
    if (stage === "otp") {
      setStage("contact");
    } else if (stage === "password") {
      setStage("otp");
    }
  };

  // Focus first OTP input when stage changes to OTP
  useEffect(() => {
    if (stage === "otp") {
      otpRefs[0].current?.focus();
    }
  }, [stage]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-semibold font-baloo text-black mb-3">
          Sign up
        </h1>
        <p className="text-gray-600">
          signup in three seconds and book your bus
        </p>
      </div>

      <div className="relative min-h-[300px]">
        {/* Contact Stage */}
        <div
          className={`absolute w-full transition-all duration-500 ease-in-out ${getAnimationClasses(
            "contact"
          )}`}
          style={{ display: stage === "contact" ? "block" : "none" }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="contact"
                className="block text-sm font-medium text-gray-700"
              >
                Email or Phone Number
              </label>
              <input
                id="contact"
                type="text"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                className="input-animated w-full px-4 py-3 bg-gray-50 rounded-lg"
                placeholder="Enter your email or phone number"
                disabled={isSubmitting}
              />
              {errors.contact && (
                <p className="text-red-500 text-sm">{errors.contact}</p>
              )}
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
                  Next <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* OTP Stage */}
        <div
          className={`absolute w-full transition-all duration-500 ease-in-out ${getAnimationClasses(
            "otp"
          )}`}
          style={{ display: stage === "otp" ? "block" : "none" }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-medium">Verification Code</h2>
                <p className="text-gray-500 mt-1">
                  We've sent a code to {contactValue}
                </p>
              </div>

              <div className="flex justify-center space-x-3 my-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={otpRefs[index]}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="otp-input"
                    maxLength={1}
                    disabled={isSubmitting}
                  />
                ))}
              </div>

              {errors.otp && (
                <p className="text-red-500 text-sm text-center">{errors.otp}</p>
              )}

              <div className="text-center">
                <button
                  type="button"
                  className="text-movaa-primary hover:underline"
                >
                  Resend Code
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="btn-hover-effect flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg flex items-center justify-center"
              >
                <ArrowLeft className="mr-2 h-5 w-5" /> Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-hover-effect flex-1 bg-movaa-primary hover:bg-movaa-light text-white py-3 rounded-lg flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Verify <Check className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Password Stage */}
        <div
          className={`absolute w-full transition-all duration-500 ease-in-out ${getAnimationClasses(
            "password"
          )}`}
          style={{ display: stage === "password" ? "block" : "none" }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-medium">Create Password</h2>
              <p className="text-gray-500 mt-1">
                Last step to complete your registration
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-animated w-full px-4 py-3 bg-gray-50 rounded-lg"
                  placeholder="Create a password"
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-animated w-full px-4 py-3 bg-gray-50 rounded-lg"
                  placeholder="Confirm your password"
                  disabled={isSubmitting}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="btn-hover-effect flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg flex items-center justify-center"
              >
                <ArrowLeft className="mr-2 h-5 w-5" /> Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-hover-effect flex-1 bg-movaa-primary hover:bg-movaa-light text-white py-3 rounded-lg flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Complete Registration"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
