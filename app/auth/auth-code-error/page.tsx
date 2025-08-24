'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../../../src/components/ui/button';

export default function AuthCodeError() {
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
              Reset Link Expired
            </h2>
            <p className="text-light-3 small-medium md:base-regular text-center mb-6 max-w-md">
              Your password reset link has expired or is invalid.
              <br />
              Please request a new password reset link.
            </p>
            
            <Link href="/forgot-password">
              <Button className="shad-button_primary">
                Request New Reset Link
              </Button>
            </Link>
            
            <Link href="/sign-in" className="mt-4">
              <Button variant="ghost" className="shad-button_ghost">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Right side - Image */}
      <div className="hidden xl:block h-screen w-1/2 bg-no-repeat bg-cover bg-center bg-[url('/assets/images/side-img.svg')]" />
    </div>
  );
}
