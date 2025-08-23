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

import { SigninValidation } from "@/lib/validation";
import { useSignInAccount } from "@/lib/react-query/queriesAndMutations";
import { useUserContext } from "@/context/SupabaseAuthContext";

const SigninForm = () => {
  const router = useRouter();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();

  // State for inline error display
  const [signInError, setSignInError] = useState<string | null>(null);

  // Query
  const { mutateAsync: signInAccount, isPending } = useSignInAccount();

  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignin = async (user: z.infer<typeof SigninValidation>) => {
    // Clear previous error
    setSignInError(null);
    
    try {
      const session = await signInAccount(user);

      if (!session) {
        setSignInError("Login failed. Please try again.");
        return;
      }

      const isLoggedIn = await checkAuthUser();

      if (isLoggedIn) {
        form.reset();
        setSignInError(null);
        router.push("/");
      } else {
        setSignInError("Authentication check failed. Please try again.");
        return;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle enhanced error messages from signInUser function
      if (error?.name === 'EmailNotConfirmedError') {
        setSignInError("⚠️ Email verification required. Please check your email and click the verification link, then try logging in again.");
        return;
      }
      
      if (error?.name === 'InvalidCredentialsError') {
        setSignInError("❌ Invalid credentials. Please check your email and password and try again.");
        return;
      }
      
      // Fallback checks for legacy error handling
      if (error?.message) {
        if (error.message.includes('email not confirmed') || 
            error.message.includes('Email not confirmed') ||
            error.message.includes('Email verification required')) {
          setSignInError("⚠️ Email verification required. Please verify your email address first, then try logging in.");
        } else if (error.message.includes('Invalid login credentials') || 
                   error.message.includes('Invalid email or password')) {
          setSignInError("❌ Invalid credentials. Please check your email and password and try again.");
        } else {
          setSignInError(`❌ Login failed: ${error.message}`);
        }
      } else {
        setSignInError("❌ An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <Form {...form}>
  <div className="w-full max-w-md px-6 flex flex-col items-center mt-20 sm:mt-0 sm:pt-2 sm:justify-center sm:min-h-full">
        <img 
          src="/assets/images/logo.svg" 
          alt="logo" 
          className="w-56 h-auto mb-6 sm:w-64 sm:mb-8"
        />

        <h2 className="text-lg font-bold text-center mb-1 sm:text-xl sm:mb-2">
          Log in to your account
        </h2>
        <p className="text-light-3 text-sm text-center mb-4 sm:mb-5">
          Welcome back! Please enter your details.
        </p>
        
        <form
          onSubmit={form.handleSubmit(handleSignin)}
          className="flex flex-col gap-3 w-full sm:gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Email</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    className="shad-input" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      // Clear error when user starts typing
                      if (signInError) setSignInError(null);
                    }}
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
                <FormLabel className="shad-form_label">Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    className="shad-input" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      // Clear error when user starts typing
                      if (signInError) setSignInError(null);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-primary-500 text-sm font-medium hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Inline error display */}
          {signInError && (
            <div className="text-red-500 text-sm mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
              {signInError}
            </div>
          )}

          <Button type="submit" className="shad-button_primary mt-3 sm:mt-4">
            {isPending || isUserLoading ? (
              <div className="flex-center gap-2">
                <Loader /> Loading...
              </div>
            ) : (
              "Log in"
            )}
          </Button>

          <p className="text-sm text-light-2 text-center mt-3 sm:mt-4">
            Don&apos;t have an account?
            <Link
              href="/sign-up"
              className="text-primary-500 text-sm font-semibold ml-1">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default SigninForm;
