"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Loader from "@/components/shared/Loader";

const ResetPasswordContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get the recovery token from URL hash
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      // Extract email from URL params if available
      const email = searchParams.get('email');
      if (email) {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      } else {
        router.push('/forgot-password');
      }
    } else {
      router.push('/forgot-password');
    }
  }, [router, searchParams]);

  return (
    <div className="flex-center min-h-screen">
      <div className="text-center">
        <Loader />
        <p className="text-light-3 mt-4">Redirecting...</p>
      </div>
    </div>
  );
};

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={
      <div className="flex-center min-h-screen">
        <div className="text-center">
          <Loader />
          <p className="text-light-3 mt-4">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPasswordPage;
