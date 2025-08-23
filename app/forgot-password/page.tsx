"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/shared/Loader";

import { ForgotPasswordValidation } from "@/lib/validation";
import { useSendPasswordResetOTP } from "@/lib/react-query/queriesAndMutations";

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Query
  const { mutateAsync: sendPasswordResetOTP, isPending } = useSendPasswordResetOTP();

  const form = useForm<z.infer<typeof ForgotPasswordValidation>>({
    resolver: zodResolver(ForgotPasswordValidation),
    defaultValues: {
      email: "",
    },
  });

  const handleForgotPassword = async (values: z.infer<typeof ForgotPasswordValidation>) => {
    setErrorMessage(null);
    
    try {
      await sendPasswordResetOTP(values.email);
      setIsSuccess(true);
    } catch (error: any) {
      console.error("Password reset error:", error);
      setErrorMessage(error.message || "Failed to send password reset email. Please try again.");
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-form">
        <div className="flex justify-between">
          <div className="auth-form_container">
            <div className="text-center space-y-6">
              <div className="flex-center w-20 h-20 bg-primary-500/10 rounded-full mx-auto">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-primary-500">
                  <path d="M4 4L20 4L20 6.9L12 12L4 6.9L4 4Z" fill="currentColor" />
                  <path d="M4 8L4 18L20 18L20 8L12 13L4 8Z" fill="currentColor" />
                </svg>
              </div>
              
              <h2 className="h3-bold md:h2-bold text-light-1">
                Check your email
              </h2>
              <div className="space-y-3">
                <p className="text-light-3 small-medium md:base-regular">
                  We've sent a password reset link to:
                </p>
                <p className="text-primary-500 font-semibold">
                  {form.getValues("email")}
                </p>
                <p className="text-light-3 small-medium md:base-regular">
                  Click the link in your email to reset your password.
                  <br />
                  The link will expire in 1 hour for security.
                </p>
              </div>
              
              <div className="flex gap-2 mt-8">
                <Button 
                  onClick={() => router.push('/sign-in')}
                  className="shad-button_primary flex-1"
                >
                  Back to Sign In
                </Button>
              </div>
              
              <p className="text-small-regular text-light-2 mt-4">
                Didn't receive an email?{" "}
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setErrorMessage(null);
                    form.reset();
                  }}
                  className="text-primary-500 text-small-semibold hover:underline"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
          
          <img
            src="/assets/images/side-img.svg"
            alt="logo"
            className="hidden xl:block h-screen w-1/2 object-cover bg-no-repeat"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <div className="flex justify-between">
        <div className="auth-form_container">
          <div className="flex-center flex-col">
            <img src="/assets/images/logo.svg" alt="logo" />

            <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">
              Forgot your password?
            </h2>
            <p className="text-light-3 small-medium md:base-regular mt-2 text-center">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {errorMessage && (
              <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-lg mt-4">
                <p className="text-red-400 text-sm">{errorMessage}</p>
              </div>
            )}

            <Form {...form}>
              <form 
                onSubmit={form.handleSubmit(handleForgotPassword)} 
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
                          {...field} 
                          placeholder="Enter your email address"
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
                      <Loader /> Sending...
                    </div>
                  ) : (
                    "Send reset link"
                  )}
                </Button>

                <p className="text-small-regular text-light-2 text-center mt-2">
                  Remember your password?{" "}
                  <Link
                    href="/sign-in"
                    className="text-primary-500 text-small-semibold ml-1"
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            </Form>
          </div>
        </div>
        
        <img
          src="/assets/images/side-img.svg"
          alt="logo"
          className="hidden xl:block h-screen w-1/2 object-cover bg-no-repeat"
        />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
