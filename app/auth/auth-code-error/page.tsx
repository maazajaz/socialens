'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../../../src/components/ui/button';

function AuthCodeErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex">
      {/* Left side - Error message */}
      <section className="flex flex-1 justify-center items-center flex-col py-10">
        <div className="flex-center size-full">
          <div className="flex-center flex-col">
            <Image
              src="/assets/images/logo.svg"
              alt="logo"
              width={270}
              height={36}
              className="mb-8"
            />

            <h2 className="h3-bold md:h2-bold text-center mb-4">
              Reset Link Issue
            </h2>
            <div className="text-light-3 small-medium md:base-regular text-center mb-6 max-w-md space-y-2">
              <p>
                There was an issue processing your password reset link.
              </p>
              {error && (
                <p className="text-red-500 bg-red-50 p-2 rounded text-sm">
                  Error: {error}
                </p>
              )}
              <p>
                This could happen if the link has expired or has already been used.
              </p>
            </div>
            
            <div className="space-y-3 w-full max-w-sm">
              <Link href="/forgot-password">
                <Button className="shad-button_primary w-full">
                  Request New Reset Link
                </Button>
              </Link>
              
              <Link href="/sign-in">
                <Button variant="ghost" className="shad-button_ghost w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Right side - Image */}
      <div className="hidden xl:block h-screen w-1/2 bg-no-repeat bg-cover bg-center bg-[url('/assets/images/side-img.svg')]" />
    </div>
  );
}

export default function AuthCodeError() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCodeErrorContent />
    </Suspense>
  );
}
