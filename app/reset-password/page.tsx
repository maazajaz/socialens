'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../src/components/ui/form';
import { useToast } from '../../src/hooks/use-toast';
import { ResetPasswordValidation } from '../../src/lib/validation';
import { updateUserPassword } from '../../src/lib/supabase/api';
import { Toaster } from '../../src/components/ui/toaster';

import type { z } from 'zod';

// Create a query client for this page
const queryClient = new QueryClient();

const ResetPasswordContent = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [success, setSuccess] = useState(false);

  const supabase = createClientComponentClient();

  const form = useForm<z.infer<typeof ResetPasswordValidation>>({
    resolver: zodResolver(ResetPasswordValidation),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const validateSession = async () => {
      try {
        console.log('Starting session validation...');
        
        // Clear any corrupted local storage that might cause cookie parsing issues
        try {
          if (typeof window !== 'undefined') {
            const supabaseKeys = Object.keys(localStorage).filter(key => 
              key.startsWith('sb-') || key.includes('supabase')
            );
            
            // Check for any malformed data and clear if needed
            for (const key of supabaseKeys) {
              const value = localStorage.getItem(key);
              if (value && (value.startsWith('base64-') || value.includes('"base64-'))) {
                console.log('Clearing potentially corrupted storage key:', key);
                localStorage.removeItem(key);
              }
            }
          }
        } catch (storageError) {
          console.log('Storage cleanup error:', storageError);
        }

        // Check for existing session (should be set by callback route or existing auth)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session && !sessionError) {
          console.log('Found existing valid session');
          
          // Additional check: ensure this is a recovery session or recently authenticated user
          try {
            const payload = JSON.parse(atob(session.access_token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            const issuedAt = payload.iat;
            const timeDiff = now - issuedAt;
            
            // Allow if it's a recovery session OR if the session was created recently (within last 30 minutes)
            const isRecoverySession = payload.amr && payload.amr.some((amr: any) => amr.method === 'recovery');
            const isRecentSession = timeDiff < 1800; // 30 minutes
            
            console.log('Session check:', {
              isRecoverySession,
              isRecentSession,
              timeDiffMinutes: Math.floor(timeDiff / 60)
            });
            
            if (isRecoverySession || isRecentSession) {
              console.log('Valid session for password reset');
              setIsSessionValid(true);
              setIsCheckingSession(false);
              return;
            } else {
              console.log('Session too old for password reset, requesting new reset link');
              throw new Error('Session expired for password reset');
            }
            
          } catch (jwtError) {
            console.log('Could not validate session timing, requesting new reset');
            throw new Error('Invalid session for password reset');
          }
        }
        
        // If no valid session, check URL for direct access
        const currentUrl = window.location.href;
        const hasAuthParams = currentUrl.includes('code=') || currentUrl.includes('access_token') || currentUrl.includes('#');
        
        if (!hasAuthParams) {
          console.log('Direct access to reset page without auth parameters');
          throw new Error('Direct access not allowed');
        }
        
        // If we reach here, there should be auth params but no session - something went wrong
        console.log('Auth parameters present but no valid session');
        throw new Error('Authentication failed');
        
      } catch (error) {
        console.error('Session validation error:', error);
        
        // Clear any potentially corrupted data
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch (signOutError) {
          console.log('Error during cleanup signout:', signOutError);
        }
        
        setIsSessionValid(false);
        setIsCheckingSession(false);
        
        // Redirect to forgot password with helpful message
        toast({
          title: "Reset session expired",
          description: "Please request a new password reset link from your email.",
          variant: "destructive",
        });
        
        // Add a small delay to show the toast
        setTimeout(() => {
          router.push('/forgot-password');
        }, 1000);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in successfully');
        setIsSessionValid(true);
        setIsCheckingSession(false);
      } else if (event === 'PASSWORD_RECOVERY' && session) {
        console.log('Password recovery session established');
        setIsSessionValid(true);
        setIsCheckingSession(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setIsSessionValid(false);
      }
    });

    validateSession();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, toast, router]);

  const resetPasswordMutation = useMutation({
    mutationFn: updateUserPassword,
    onSuccess: () => {
      setSuccess(true);
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      
      // Redirect to sign-in page after a delay
      setTimeout(() => {
        router.push('/sign-in');
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof ResetPasswordValidation>) => {
    resetPasswordMutation.mutate(values.password);
  };

  if (isCheckingSession) {
    return (
      <div className="flex-center size-full">
        <div className="flex-center flex-col">
          <div className="flex-center">
            <Image
              src="/assets/icons/loader.svg"
              alt="Loading"
              width={24}
              height={24}
              className="animate-spin"
            />
          </div>
          <p className="small-medium text-light-2 mt-2">Validating session...</p>
        </div>
      </div>
    );
  }

  if (!isSessionValid) {
    return (
      <div className="flex-center size-full">
        <div className="flex-center flex-col">
          <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12 text-center">
            Authentication Required
          </h2>
          <p className="text-light-3 small-medium md:base-regular mt-2 text-center max-w-md">
            To reset your password, please click the reset link from your email.
            <br />
            If you don't have a reset link, request a new one below.
          </p>
          <Link href="/forgot-password" className="mt-4">
            <Button className="shad-button_primary">
              Request Reset Link
            </Button>
          </Link>
          <Link href="/sign-in" className="mt-2">
            <Button variant="ghost" className="shad-button_ghost">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex-center size-full">
        <div className="flex-center flex-col">
          <div className="flex-center mb-4">
            <Image
              src="/assets/icons/like.svg"
              alt="Success"
              width={48}
              height={48}
              className="text-green-500"
            />
          </div>
          <h2 className="h3-bold md:h2-bold text-center">
            Password Updated!
          </h2>
          <p className="text-light-3 small-medium md:base-regular mt-2 text-center">
            Your password has been updated successfully.
            <br />
            Redirecting you to sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <div className="sm:w-420 flex-center flex-col">
        <Image
          src="/assets/images/logo.svg"
          alt="logo"
          width={270}
          height={36}
        />

        <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">
          Create new password
        </h2>
        <p className="text-light-3 small-medium md:base-regular mt-2">
          Your new password must be different from previously used passwords
        </p>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5 w-full mt-4"
        >
          <FormField
            control={form.control}
            name="password"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel className="shad-form_label">New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    className="shad-input"
                    placeholder="Enter your new password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    className="shad-input"
                    placeholder="Confirm your new password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="shad-button_primary"
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? (
              <div className="flex-center gap-2">
                <Image
                  src="/assets/icons/loader.svg"
                  alt="Loading"
                  width={24}
                  height={24}
                  className="animate-spin"
                />
                Updating Password...
              </div>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>

        <p className="text-small-regular text-light-2 text-center mt-2">
          Remember your password?{" "}
          <Link
            href="/sign-in"
            className="text-primary-500 text-small-semibold ml-1"
          >
            Sign in
          </Link>
        </p>
      </div>
    </Form>
  );
};

export default function ResetPassword() {
  useEffect(() => {
    console.log('Reset password page mounted');
    console.log('Current pathname:', window.location.pathname);
    console.log('Current href:', window.location.href);
    
    // Prevent any redirects for 5 seconds to debug
    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      console.log('History push intercepted:', args);
      return originalPush.apply(this, args);
    };
    
    window.history.replaceState = function(...args) {
      console.log('History replace intercepted:', args);
      return originalReplace.apply(this, args);
    };
    
    return () => {
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex">
        {/* Left side - Form */}
        <section className="flex flex-1 justify-center items-center flex-col py-10">
          <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
          </Suspense>
        </section>
        
        {/* Right side - Image */}
        <div className="hidden xl:block h-screen w-1/2 bg-no-repeat bg-cover bg-center bg-[url('/assets/images/side-img.svg')]" />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
