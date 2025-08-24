'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

const UpdatePasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UpdatePasswordFormData = z.infer<typeof UpdatePasswordSchema>;

export default function UpdatePassword() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [success, setSuccess] = useState(false);

  const supabase = createClientComponentClient();

  const form = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(UpdatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && !error) {
          console.log('User authenticated, can update password');
          setIsAuthenticated(true);
        } else {
          console.log('User not authenticated');
          toast({
            title: "Authentication required",
            description: "Please click the link from your email to access this page.",
            variant: "destructive",
          });
          router.push('/forgot-password');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/forgot-password');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, toast, router]);

  const updatePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => {
      setSuccess(true);
      toast({
        title: "Password updated successfully!",
        description: "You can now sign in with your new password.",
      });
      
      // Sign out and redirect to sign-in after 3 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
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

  const onSubmit = (values: UpdatePasswordFormData) => {
    updatePasswordMutation.mutate(values.password);
  };

  if (isLoading) {
    return (
      <div className="flex-center size-full min-h-screen">
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
          <p className="small-medium text-light-2 mt-2">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-center size-full min-h-screen">
        <div className="flex-center flex-col">
          <h2 className="h3-bold md:h2-bold text-center">
            Authentication Required
          </h2>
          <p className="text-light-3 small-medium md:base-regular mt-2 text-center">
            Please click the magic link from your email to update your password.
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
                Password Updated!
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
              Update Your Password
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
                    <FormLabel className="shad-form_label">Confirm Password</FormLabel>
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
                disabled={updatePasswordMutation.isPending}
              >
                {updatePasswordMutation.isPending ? (
                  <div className="flex-center gap-2">
                    <Image
                      src="/assets/icons/loader.svg"
                      alt="Loading"
                      width={24}
                      height={24}
                      className="animate-spin"
                    />
                    Updating...
                  </div>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>

            <p className="text-small-regular text-light-2 text-center mt-2">
              <Link
                href="/sign-in"
                className="text-primary-500 text-small-semibold ml-1"
              >
                Back to sign in
              </Link>
            </p>
          </div>
        </Form>
      </section>

      <div className="hidden xl:block h-screen w-1/2 bg-no-repeat bg-cover bg-center bg-[url('/assets/images/side-img.svg')]" />
    </div>
  );
}
