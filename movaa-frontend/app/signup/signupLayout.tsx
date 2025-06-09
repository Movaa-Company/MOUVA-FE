'use client';
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import Image from 'next/image';

const SignUpLayout = ({ SignUpForm }: { SignUpForm: React.ComponentType }) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen w-full bg-white overflow-hidden">
      {isMobile ? (
        <MobileLayout SignUpForm={SignUpForm} />
      ) : (
        <DesktopLayout>
          <SignUpForm />
        </DesktopLayout>
      )}
    </div>
  );
};

const DesktopLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div className="w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-800 opacity-5"></div>
        <Image
          src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
          alt="Luxury Bus"
          className="object-cover h-full w-full opacity-95 transition-transform duration-10000 ease-in-out hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
      </div>

      {/* Right side - Form */}
      <div className="w-1/2 flex items-center justify-center p-10">
        <div className="glass w-full max-w-md p-8 rounded-2xl">{children}</div>
      </div>
    </div>
  );
};

const MobileLayout = ({ SignUpForm }: { SignUpForm: React.ComponentType }) => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6">
      <div className="glass w-full max-w-md p-6 rounded-2xl">
        <SignUpForm />
      </div>
    </div>
  );
};

export default SignUpLayout;
