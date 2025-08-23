"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/shared/Loader";

import { ResetPasswordValidation } from "@/lib/validation";
import { useVerifyPasswordResetOTP } from "@/lib/react-query/queriesAndMutations";

const VerifyOTPContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const [otpValue, setOtpValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Query
  const { mutateAsync: verifyPasswordResetOTP, isPending } = useVerifyPasswordResetOTP();

  const otpForm = useForm({
    defaultValues: {
      otp: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof ResetPasswordValidation>>({
    resolver: zodResolver(ResetPasswordValidation),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      router.push('/forgot-password');
    }
  }, [email, router]);

  const handleOTPSubmit = (values: { otp: string }) => {
    setOtpValue(values.otp);
    setStep('password');
  };

  const handlePasswordReset = async (values: z.infer<typeof ResetPasswordValidation>) => {
    setErrorMessage(null);
    
    try {
      await verifyPasswordResetOTP({
        email,
        token: otpValue,
        newPassword: values.password,
      });
      
      setIsSuccess(true);
      
      // Redirect to sign-in page after success
      setTimeout(() => {
        router.push('/sign-in');
      }, 3000);
    } catch (error: any) {
      console.error("Password reset verification error:", error);
      setErrorMessage(error.message || "Failed to reset password. Please check your code and try again.");
      setStep('otp'); // Go back to OTP step
      setOtpValue('');
    }
  };

  if (!email) {
    return (
      <div className="sm:w-420 flex-center flex-col">
        <div className="text-center">
          <p className="text-light-3">Redirecting...</p>
          <Loader />
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="sm:w-420 flex-center flex-col">
        <img src="/assets/images/logo.svg" alt="logo" />
        
        <div className="text-center space-y-4 mt-8">
          <div className="flex-center w-16 h-16 bg-green-500/10 rounded-full mx-auto">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-green-500">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12 text-green-500">
            Password Reset Successful!
          </h2>
          <p className="text-light-3 small-medium md:base-regular mt-2">
            Your password has been successfully updated.
            <br />
            You'll be redirected to sign in shortly.
          </p>
          
          <div className="flex gap-2 mt-6">
            <Button 
              onClick={() => router.push('/sign-in')}
              className="shad-button_primary flex-1"
            >
              Continue to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:w-420 flex-center flex-col">
      <img src="/assets/images/logo.svg" alt="logo" />

      {step === 'otp' ? (
        <>
          <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">
            Enter verification code
          </h2>
          <p className="text-light-3 small-medium md:base-regular mt-2 text-center">
            We sent a 6-digit code to
            <br />
            <span className="text-primary-500 font-medium">{email}</span>
          </p>

          {errorMessage && (
            <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-lg mt-4">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          <Form {...otpForm}>
            <form 
              onSubmit={otpForm.handleSubmit(handleOTPSubmit)} 
              className="flex flex-col gap-5 w-full mt-4"
            >
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form_label">Verification Code</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        className="shad-input text-center text-2xl tracking-widest"
                        {...field} 
                        placeholder="000000"
                        maxLength={6}
                        pattern="[0-9]{6}"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="shad-button_primary"
                disabled={isPending}
              >
                Verify Code
              </Button>
            </form>
          </Form>
        </>
      ) : (
        <>
          <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">
            Create new password
          </h2>
          <p className="text-light-3 small-medium md:base-regular mt-2 text-center">
            Choose a strong password to secure your account
          </p>

          {errorMessage && (
            <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-lg mt-4">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          <Form {...passwordForm}>
            <form 
              onSubmit={passwordForm.handleSubmit(handlePasswordReset)} 
              className="flex flex-col gap-5 w-full mt-4"
            >
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form_label">New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        className="shad-input" 
                        {...field} 
                        placeholder="Enter new password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form_label">Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        className="shad-input" 
                        {...field} 
                        placeholder="Confirm new password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="shad-button_primary"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex-center gap-2">
                    <Loader /> Updating password...
                  </div>
                ) : (
                  "Update Password"
                )}
              </Button>

              <Button 
                type="button" 
                variant="ghost"
                className="text-light-3"
                onClick={() => setStep('otp')}
              >
                ← Back to verification code
              </Button>
            </form>
          </Form>
        </>
      )}

      <div className="text-center mt-6">
        <p className="text-small-regular text-light-2">
          Remember your password?{" "}
          <Link
            href="/sign-in"
            className="text-primary-500 text-small-semibold ml-1"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

const VerifyOTPPage = () => {
  return (
    <Suspense fallback={
      <div className="flex-center min-h-screen">
        <div className="text-center">
          <Loader />
          <p className="text-light-3 mt-4">Loading...</p>
        </div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
};

export default VerifyOTPPage;
