"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../src/components/ui/form";
import { Input } from "../../src/components/ui/input";
import { Button } from "../../src/components/ui/button";

const ForgotPasswordValidation = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const ForgotPasswordPage = () => {
  const router = useRouter();

  const form = useForm<z.infer<typeof ForgotPasswordValidation>>({
    resolver: zodResolver(ForgotPasswordValidation),
    defaultValues: {
      email: "",
    },
  });

  const handleForgotPassword = (values: z.infer<typeof ForgotPasswordValidation>) => {
    // Redirect to reset-password page with email prefilled
    router.push(`/reset-password?email=${encodeURIComponent(values.email)}`);
  };

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
              Forgot Password?
            </h2>
            <p className="text-light-3 small-medium md:base-regular mt-2">
              Enter your email to reset your password
            </p>

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
                      <Input type="email" className="shad-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="shad-button_primary">
                Continue
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
};

export default ForgotPasswordPage;
