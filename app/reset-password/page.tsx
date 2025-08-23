'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../src/components/ui/form';
import { useToast } from '../../src/hooks/use-toast';
import { ResetPasswordValidation } from '../../src/lib/validation';
import { updateUserPassword } from '../../src/lib/supabase/api';

import type { z } from 'zod';

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
        console.log('Current URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        
        // Check for existing session first
        console.log('Checking for existing session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session && !sessionError) {
          console.log('Found existing valid session');
          setIsSessionValid(true);
          setIsCheckingSession(false);
          return;
        }
        
        // Then check for tokens in URL hash (email link flow)
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
          console.log('Found hash in URL, processing tokens...');
          // Remove the # and parse as URL params
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const tokenType = hashParams.get('token_type');
          const expiresIn = hashParams.get('expires_in');
          
          console.log('Token details:', { 
            hasAccessToken: !!accessToken, 
            hasRefreshToken: !!refreshToken, 
            tokenType,
            expiresIn 
          });
          
          if (accessToken) {
            console.log('Setting session from URL tokens...');
            const sessionData: any = {
              access_token: accessToken,
              token_type: tokenType || 'bearer',
              expires_in: parseInt(expiresIn || '3600'),
              user: null
            };
            
            if (refreshToken) {
              sessionData.refresh_token = refreshToken;
            }
            
            const { data, error } = await supabase.auth.setSession(sessionData);
            
            if (!error && data.session) {
              console.log('Session set successfully!');
              setIsSessionValid(true);
              // Clean up URL
              window.history.replaceState({}, document.title, window.location.pathname);
              setIsCheckingSession(false);
              return;
            } else {
              console.error('Error setting session:', error);
            }
          }
        }
        
        // No valid session found
        console.log('No valid session found, redirecting to forgot password');
        setIsSessionValid(false);
        
      } catch (error) {
        console.error('Session validation error:', error);
        setIsSessionValid(false);
      } finally {
        console.log('Session validation complete');
        setIsCheckingSession(false);
      }
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(validateSession, 500);
    return () => clearTimeout(timer);
  }, [supabase.auth]);

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
            Session Expired
          </h2>
          <p className="text-light-3 small-medium md:base-regular mt-2 text-center">
            Your password reset link has expired or is invalid.
            <br />
            Please request a new password reset link.
          </p>
          <Link href="/forgot-password" className="mt-4">
            <Button className="shad-button_primary">
              Request New Link
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
  return (
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
  );
}
