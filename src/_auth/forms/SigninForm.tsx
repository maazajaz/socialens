"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/shared/Loader";
import { useToast } from "@/components/ui/use-toast";

import { SigninValidation } from "@/lib/validation";
import { useSignInAccount } from "@/lib/react-query/queriesAndMutations";
import { useUserContext } from "@/context/SupabaseAuthContext";

const SigninForm = () => {
  const { toast } = useToast();
  const router = useRouter();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();

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
    try {
      const session = await signInAccount(user);

      if (!session) {
        toast({ title: "Login failed. Please try again." });
        return;
      }

      const isLoggedIn = await checkAuthUser();

      if (isLoggedIn) {
        form.reset();
        toast({ title: "Login successful!" });
        router.push("/");
      } else {
        toast({ title: "Authentication check failed. Please try again." });
        return;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({ title: "An error occurred during login." });
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
                  <Input type="text" className="shad-input" {...field} />
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
                  <Input type="password" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
