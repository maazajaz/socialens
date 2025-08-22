"use client";

import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserContext } from "@/context/SupabaseAuthContext";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useUserContext();

  useEffect(() => {
    // Prevent scrolling on auth pages
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    
    return () => {
      // Restore scrolling when leaving auth pages
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    };
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full h-full flex overflow-hidden auth-layout">
      <section className="flex flex-1 justify-start items-start pt-4 sm:justify-center sm:items-center flex-col px-4 min-h-0">
        <Outlet />
      </section>
      <img
        src="/assets/images/side-img.svg"
        alt="logo"
        className="hidden xl:block h-full w-1/2 object-cover bg-no-repeat flex-shrink-0"
      />
    </div>
  );
}
