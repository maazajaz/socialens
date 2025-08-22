'use client';

import { useEffect, useState } from 'react';
import { QueryProvider } from '../../src/lib/react-query/QueryProvider';
import { AuthProvider, useUserContext } from '../../src/context/SupabaseAuthContext';
import Topbar from '../../src/components/shared/Topbar';
import LeftSidebar from '../../src/components/shared/LeftSidebar';
import Bottombar from '../../src/components/shared/Bottombar';
import { Toaster } from '../../src/components/ui/toaster';
import { useRouter } from 'next/navigation';

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex-center w-full h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full md:flex">
      <Topbar />
      <LeftSidebar />

      <section className="flex flex-1 h-full">
        {children}
      </section>

      <Bottombar />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <QueryProvider>
      <AuthProvider>
        <AuthenticatedLayout>
          {children}
        </AuthenticatedLayout>
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  );
}
