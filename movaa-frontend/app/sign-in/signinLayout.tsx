import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SignInLayoutProps {
  SignInForm: React.ComponentType;
}

const SignInLayout = ({ SignInForm }: SignInLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen w-full bg-white overflow-hidden">
      {isMobile ? (
        <MobileLayout SignInForm={SignInForm} />
      ) : (
        <DesktopLayout SignInForm={SignInForm} />
      )}
    </div>
  );
};

const DesktopLayout = ({ SignInForm }: SignInLayoutProps) => {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Image */}
      <div className="w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-800 opacity-5"></div>
        <img
          src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
          alt="Bus Interior"
          className="object-cover h-full w-full opacity-95 transition-transform duration-10000 ease-in-out hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
      </div>

      {/* Right side - Form */}
      <div className="w-1/2 flex items-center justify-center p-10">
        <div className="glass w-full max-w-md p-8 rounded-2xl">
          <SignInForm />
        </div>
      </div>
    </div>
  );
};

const MobileLayout = ({ SignInForm }: SignInLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6">
      <div className="glass w-full max-w-md p-6 rounded-2xl">
        <SignInForm />
      </div>
    </div>
  );
};

export default SignInLayout;
