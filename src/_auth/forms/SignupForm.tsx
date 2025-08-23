"use client";

import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { SignupValidation } from "@/lib/validation"
import Loader from "@/components/shared/Loader"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useCreateUserAccount, useSignInAccount } from "@/lib/react-query/queriesAndMutations"





const SignupForm = () => {
  const { toast } = useToast()
  const router = useRouter()

  // 1. Define your form.
  const form = useForm<z.infer<typeof SignupValidation>>({
    resolver: zodResolver(SignupValidation),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
  })

  const { mutateAsync: createUserAccount, isPending: isCreatingAccount } = useCreateUserAccount();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mutateAsync: _signInAccount, isPending: isSigningInUser } = useSignInAccount();
 
  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof SignupValidation>) {
    try {
      console.log('Starting signup process with values:', { 
        name: values.name, 
        username: values.username, 
        email: values.email 
      });

      const newUser = await createUserAccount(values);

      console.log('Signup result:', newUser);

      if (!newUser) {
        console.error('Signup failed: newUser is null/undefined');
        toast({ 
          title: "Sign up failed", 
          description: "Unable to create account. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Show success message
      toast({ 
        title: "Account created successfully!", 
        description: "Please sign in with your new account."
      });

      // Redirect to sign-in page
      router.push('/sign-in');
      
    } catch (error: any) {
      console.error('Signup error details:', error);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      let errorMessage = "Sign up failed. Please try again.";
      
      if (error?.message) {
        if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          errorMessage = "An account with this email or username already exists.";
        } else if (error.message.includes('weak password') || error.message.includes('password')) {
          errorMessage = "Password is too weak. Please use a stronger password.";
        } else if (error.message.includes('invalid email') || error.message.includes('email')) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message.includes('row-level security policy') || error.code === '42501') {
          errorMessage = "Account creation is temporarily unavailable. Please try again later or contact support.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({ 
        title: "Sign up failed", 
        description: errorMessage,
        variant: "destructive"
      });
    }
  }
  return (
    <Form {...form}>
  <div className="w-full max-w-md px-6 flex flex-col items-center mt-6 sm:mt-0 sm:pt-1 sm:justify-center sm:min-h-full">
      <img 
        src="/assets/images/logo.svg" 
        alt="logo" 
        className="w-56 h-auto mb-6 sm:w-64 sm:mb-8"
      />

      <h2 className="text-base font-bold text-center mb-1 sm:text-lg sm:mb-1">
        Create a new account
      </h2>
      <p className="text-light-3 text-xs text-center mb-2 sm:text-sm sm:mb-3">
        To use SociaLens, Please enter your details
      </p>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-1 w-full sm:gap-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label text-xs sm:text-sm">Name</FormLabel>
                <FormControl>
                  <Input type="text" className="shad-input h-8 sm:h-10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label text-sm">Username</FormLabel>
                <FormControl>
                  <Input type="text" className="shad-input h-10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label text-sm">Email</FormLabel>
                <FormControl>
                  <Input type="text" className="shad-input h-10" {...field} />
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
                <FormLabel className="shad-form_label text-sm">Password</FormLabel>
                <FormControl>
                  <Input type="password" className="shad-input h-10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="shad-button_primary mt-2 h-10">
            {isCreatingAccount || isSigningInUser ? (
              <div className="flex-center gap-2">
                <Loader /> Loading...
              </div>
            ) : (
              "Sign Up"
            )}
          </Button>

          <p className="text-sm text-light-2 text-center mt-2">
            Already have an account?
            <Link
              href="/sign-in"
              className="text-primary-500 text-sm font-semibold ml-1">
              Log in
            </Link>
          </p>
        </form>
    </div>
  </Form>
  )
}

export default SignupForm