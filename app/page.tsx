'use client';

import { useEffect, useState } from 'react';
import { QueryProvider } from '../src/lib/react-query/QueryProvider';
import { AuthProvider } from '../src/context/SupabaseAuthContext';
import Home from '../src/_root/pages/Home';
import { Toaster } from '../src/components/ui/toaster';

export default function HomePage() {
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
        <main className="flex h-screen">
          <Home />
        </main>
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  );
}
