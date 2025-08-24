'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import * as z from 'zod';

import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../src/components/ui/form';
import { useToast } from '../../src/hooks/use-toast';

const ResetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  token: z.string().min(6, 'Please enter the 6-digit code'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [success, setSuccess] = useState(false);

  const supabase = createClientComponentClient();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      email: "",
      token: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Set email from query params if available
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      form.setValue('email', emailParam);
      setStep('email'); // Start with email step
    }
  }, [searchParams, form]);

  // Send OTP mutation
  const sendOTPMutation = useMutation({
    mutationFn: async (email: string) => {
      // Send OTP for password reset
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setStep('otp');
      toast({
        title: "Reset code sent! 📧",
        description: "Check your email for the 6-digit code.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error sending reset code",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Verify OTP and reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (values: ResetPasswordFormData) => {
      // Verify OTP and set new password
      const { error } = await supabase.auth.verifyOtp({
        email: values.email,
        token: values.token,
        type: 'email'
      });
      
      if (error) throw error;

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password
      });

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      setSuccess(true);
      toast({
        title: "Password updated successfully! 🎉",
        description: "You can now sign in with your new password.",
      });
      
      setTimeout(() => {
        router.push('/sign-in');
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Error resetting password",
        description: error.message || "Please check your code and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ResetPasswordFormData) => {
    if (step === 'email') {
      sendOTPMutation.mutate(values.email);
    } else {
      resetPasswordMutation.mutate(values);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex">
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
                Password Reset Complete! 🎉
              </h2>
              <p className="text-light-3 small-medium md:base-regular mt-2 text-center">
                Your password has been updated successfully.
                <br />
                Redirecting you to sign in...
              </p>
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
              {step === 'email' ? 'Reset Your Password 🔐' : 'Enter Reset Code 📧'}
            </h2>
            <p className="text-light-3 small-medium md:base-regular mt-2">
              {step === 'email' 
                ? 'We\'ll send you a 6-digit code to reset your password'
                : 'Enter the 6-digit code sent to your email'
              }
            </p>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5 w-full mt-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form_label">Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        className="shad-input" 
                        disabled={step === 'otp'}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {step === 'otp' && (
                <>
                  <FormField
                    control={form.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="shad-form_label">Reset Code</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            className="shad-input text-center font-mono text-lg tracking-widest" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                        <FormLabel className="shad-form_label">Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" className="shad-input" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Button 
                type="submit" 
                className="shad-button_primary"
                disabled={sendOTPMutation.isPending || resetPasswordMutation.isPending}
              >
                {sendOTPMutation.isPending || resetPasswordMutation.isPending ? (
                  <div className="flex-center gap-2">
                    <Image
                      src="/assets/icons/loader.svg"
                      alt="Loading"
                      width={24}
                      height={24}
                      className="animate-spin"
                    />
                    {step === 'email' ? 'Sending Code...' : 'Resetting Password...'}
                  </div>
                ) : (
                  step === 'email' ? 'Send Reset Code 📨' : 'Reset Password 🔐'
                )}
              </Button>

              {step === 'otp' && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="text-primary-500 hover:text-primary-600"
                  onClick={() => {
                    setStep('email');
                    form.setValue('token', '');
                    form.setValue('password', '');
                    form.setValue('confirmPassword', '');
                  }}
                >
                  ← Back to email
                </Button>
              )}
            </form>

            <p className="text-small-regular text-light-2 text-center mt-2">
              Remember your password?
              <Link
                href="/sign-in"
                className="text-primary-500 text-small-semibold ml-1 hover:text-primary-600"
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
