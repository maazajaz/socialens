"use client";

import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useUserContext } from '../context/SupabaseAuthContext';
import { useUserActivity } from '../hooks/useUserActivity';
import Topbar from '../components/shared/Topbar';
import LeftSidebar from '../components/shared/LeftSidebar';
import Bottombar from '../components/shared/Bottombar';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

const ClientLayoutWrapper = ({ children }: ClientLayoutWrapperProps) => {
  const [isClient, setIsClient] = useState(false);
  const { isAuthenticated, isLoading } = useUserContext();
  
  // Track user activity when authenticated
  useUserActivity();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    window.location.href = '/sign-in';
    return null;
  }

  return (
    <BrowserRouter>
      <div className="w-full md:flex">
        <LeftSidebar />
        <section className="flex flex-1 h-full">
          {children}
        </section>
        <Topbar />
        <Bottombar />
      </div>
    </BrowserRouter>
  );
};

export default ClientLayoutWrapper;
