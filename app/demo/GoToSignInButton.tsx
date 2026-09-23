"use client";

import { useRouter } from 'next/navigation';
import React from 'react';

export function GoToSignInButton() {
  const router = useRouter();
  return (
    <button onClick={() => router.push('/sign-in')}>Go to Sign in</button>
  );
}
