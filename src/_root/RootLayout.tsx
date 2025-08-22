"use client";

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserContext } from "@/context/SupabaseAuthContext";
import Topbar from "@/components/shared/Topbar";
import LeftSidebar from "@/components/shared/LeftSidebar";
import Bottombar from "@/components/shared/Bottombar";

const RootLayout = () => {
  const { isAuthenticated, isLoading } = useUserContext();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="w-full md:flex">
      <Topbar />
      <LeftSidebar />

      <section className="flex flex-1 h-full">
        <Outlet />
      </section>

      <Bottombar />
    </div>
  );
};

export default RootLayout;
