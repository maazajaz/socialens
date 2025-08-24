'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../src/components/ui/form';
import { useToast } from '../../src/hooks/use-toast';
import { updateUserPassword } from '../../src/lib/supabase/api';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const ResetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const supabase = createClientComponentClient();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Check for password reset tokens from email link
  useEffect(() => {
    const checkResetToken = async () => {
      try {
        // Parse URL hash for tokens (Supabase redirects with tokens in hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        if (accessToken && refreshToken && type === 'recovery') {
          console.log('Found reset tokens in URL hash');
          
          // Set the session with the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Error setting session:', error);
            toast({
              title: "Invalid reset link",
              description: "This reset link is invalid or has expired.",
              variant: "destructive",
            });
            setIsValidToken(false);
          } else {
            console.log('Successfully set session for password reset');
            setIsValidToken(true);
            toast({
              title: "Email verified! 🎉",
              description: "Please enter your new password below.",
            });
            
            // Clean up URL hash
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else {
          // No valid tokens found
          console.log('No valid reset tokens found in URL');
          setIsValidToken(false);
          toast({
            title: "Invalid reset link",
            description: "Please use the reset link from your email.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error checking reset token:', error);
        setIsValidToken(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkResetToken();
  }, [supabase, toast]);

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (values: ResetPasswordFormData) => {
      return await updateUserPassword(values.password);
    },
    onSuccess: () => {
      setSuccess(true);
      toast({
        title: "Password updated successfully! 🎉",
        description: "You can now sign in with your new password.",
      });
      
      // Redirect to sign-in after 3 seconds
      setTimeout(() => {
        router.push('/sign-in');
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating password",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ResetPasswordFormData) => {
    resetPasswordMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p>Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex">
        <section className="flex flex-1 justify-center items-center flex-col py-10">
          <div className="sm:w-420 flex-center flex-col">
            <Image
              src="/assets/images/logo.svg"
              alt="logo"
              width={270}
              height={36}
            />

            <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12 text-center">
              Invalid Reset Link
            </h2>
            <p className="text-light-3 small-medium md:base-regular mt-2 text-center">
              This password reset link is invalid or has expired. Please request a new one.
            </p>

            <Link href="/forgot-password">
              <Button className="shad-button_primary mt-4">
                Request New Reset Link
              </Button>
            </Link>

            <p className="text-small-regular text-light-2 text-center mt-4">
              Remember your password?
              <Link
                href="/sign-in"
                className="text-primary-500 text-small-semibold ml-1"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>

        <div className="hidden xl:block h-screen w-1/2 bg-no-repeat bg-cover bg-center bg-[url('/assets/images/side-img.svg')]" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex">
        <section className="flex flex-1 justify-center items-center flex-col py-10">
          <div className="sm:w-420 flex-center flex-col">
            <Image
              src="/assets/images/logo.svg"
              alt="logo"
              width={270}
              height={36}
            />

            <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12 text-center">
              Password Updated! 🎉
            </h2>
            <p className="text-light-3 small-medium md:base-regular mt-2 text-center">
              Your password has been successfully updated. Redirecting to sign in...
            </p>

            <div className="flex flex-col gap-2 w-full mt-8">
              <Link href="/sign-in">
                <Button className="shad-button_primary w-full">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="hidden xl:block h-screen w-1/2 bg-no-repeat bg-cover bg-center bg-[url('/assets/images/side-img.svg')]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <section className="flex flex-1 justify-center items-center flex-col py-10">
        <Form {...form}>
          <div className="sm:w-420 flex-center flex-col">
            <Image
              src="/assets/images/logo.svg"
              alt="logo"
              width={270}
              height={36}
            />

            <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">
              Set New Password
            </h2>
            <p className="text-light-3 small-medium md:base-regular mt-2">
              Enter your new password below
            </p>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5 w-full mt-4"
            >
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form_label">New Password</FormLabel>
                    <FormControl>
                      <Input type="password" className="shad-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form_label">Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" className="shad-input" {...field} />
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
                {resetPasswordMutation.isPending ? "Updating..." : "Update Password"}
              </Button>
            </form>

            <p className="text-small-regular text-light-2 text-center mt-2">
              Remember your password?
              <Link
                href="/sign-in"
                className="text-primary-500 text-small-semibold ml-1"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Form>
      </section>

      <div className="hidden xl:block h-screen w-1/2 bg-no-repeat bg-cover bg-center bg-[url('/assets/images/side-img.svg')]" />
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
