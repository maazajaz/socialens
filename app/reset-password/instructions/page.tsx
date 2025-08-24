'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../../../src/components/ui/button';

export default function PasswordResetInstructions() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Instructions */}
      <section className="flex flex-1 justify-center items-center flex-col py-10">
        <div className="flex-center size-full">
          <div className="flex-center flex-col max-w-md">
            <Image
              src="/assets/images/logo.svg"
              alt="logo"
              width={270}
              height={36}
              className="mb-8"
            />

            <h2 className="h3-bold md:h2-bold text-center mb-6">
              Check Your Email
            </h2>
            
            <div className="text-light-3 small-medium md:base-regular text-left space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  1
                </div>
                <p>Check your email inbox for a password reset message from SocialEns.</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  2
                </div>
                <p>Click the "Reset Password" button or link in the email.</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  3
                </div>
                <p>You'll be automatically signed in and can set your new password.</p>
              </div>
            </div>

            <div className="text-center text-light-4 small-regular mb-6">
              <p>Don't see the email? Check your spam folder or request a new link.</p>
            </div>
            
            <div className="flex flex-col space-y-3 w-full">
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
