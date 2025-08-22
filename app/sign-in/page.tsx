'use client';

import { useEffect, useState } from 'react';
import { QueryProvider } from '../../src/lib/react-query/QueryProvider';
import { AuthProvider } from '../../src/context/SupabaseAuthContext';
import SigninForm from '../../src/_auth/forms/SigninForm';
import { Toaster } from '../../src/components/ui/toaster';

export default function SignInPage() {
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
        <div className="min-h-screen flex">
          {/* Left side - Form */}
          <section className="flex flex-1 justify-center items-center flex-col py-10">
            <SigninForm />
          </section>
          
          {/* Right side - Image */}
          <div className="hidden xl:block h-screen w-1/2 bg-no-repeat bg-cover bg-center bg-[url('/assets/images/side-img.svg')]" />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  );
}
