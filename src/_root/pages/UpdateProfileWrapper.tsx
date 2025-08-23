"use client";

import React, { useEffect } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { Textarea, Input, Button } from "@/components/ui";

import { ProfileValidation } from "@/lib/validation";
import { useUserContext } from "@/context/SupabaseAuthContext";
import { useGetUserById, useUpdateUser, useGetCurrentUser } from "@/lib/react-query/queriesAndMutations";
import Loader from "@/components/shared/Loader";
import ProfileUploader from "@/components/shared/ProfileUploder";

type UpdateProfileWrapperProps = {
  params: { id: string };
};

const UpdateProfileWrapper = ({ params }: UpdateProfileWrapperProps) => {
  const { toast } = useToast();
  const router = useRouter();
  const { id } = params;
  const { user, setUser } = useUserContext();
  
  // Queries
  const { data: currentUser } = useGetUserById(id || "");
  const { refetch: refetchCurrentUser } = useGetCurrentUser();
  const { mutateAsync: updateUser, isPending: isLoadingUpdate } = useUpdateUser();

  const form = useForm<z.infer<typeof ProfileValidation>>({
    resolver: zodResolver(ProfileValidation),
    defaultValues: {
      file: [],
      name: "",
      username: "",
      email: "",
      bio: "",
    },
  });

  // Update form when currentUser data loads
  useEffect(() => {
    if (currentUser) {
      form.reset({
        file: [],
        name: currentUser.name || "",
        username: currentUser.username || "",
        email: currentUser.email || "",
        bio: currentUser.bio || "",
      });
    }
  }, [currentUser, form]);

  if (!currentUser) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  // Handle Update Profile
  const handleUpdate = async (value: z.infer<typeof ProfileValidation>) => {
    try {
      const updateData: any = {
        userId: currentUser.id,
        name: value.name,
        username: currentUser.username, 
        email: currentUser.email,
        bio: value.bio,
        file: value.file,
        imageUrl: currentUser.image_url,
      };

      const updatedUser = await updateUser(updateData);

      if (!updatedUser) {
        toast({
          title: "Update user failed. Please try again.",
        });
        return;
      }

      // Update user context with proper null handling
      if (user) {
        setUser({
          ...user,
          name: updatedUser.name,
          bio: updatedUser.bio,
          image_url: updatedUser.image_url,
        });
      }

      await refetchCurrentUser();
      
      toast({
        title: "Profile updated successfully!",
      });
      
      router.push(`/profile/${id}`);
    } catch (error) {
      console.log({ error });
      toast({
        title: "Update user failed. Please try again.",
      });
    }
  };

  return (
    <div className="flex flex-1">
      <div className="common-container pb-32 md:pb-12">
        <div className="flex-start gap-3 justify-start w-full max-w-5xl">
          <img
            src="/assets/icons/edit.svg"
            width={36}
            height={36}
            alt="edit"
            className="invert-white"
          />
          <h2 className="h3-bold md:h2-bold text-left w-full">Edit Profile</h2>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleUpdate)}
            className="flex flex-col gap-7 w-full mt-4 max-w-5xl"
          >
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem className="flex">
                  <FormControl>
                    <ProfileUploader
                      fieldChange={field.onChange}
                      mediaUrl={currentUser.image_url}
                    />
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Name</FormLabel>
                  <FormControl>
                    <Input type="text" className="shad-input" {...field} />
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
                  <FormLabel className="shad-form_label">Username</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      className="shad-input"
                      {...field}
                      disabled
                    />
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
                  <FormLabel className="shad-form_label">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      className="shad-input"
                      {...field}
                      disabled
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      className="shad-textarea custom-scrollbar"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            <div className="flex gap-4 items-center justify-end pt-6 pb-4">
              <Button
                type="button"
                className="shad-button_dark_4"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="shad-button_primary whitespace-nowrap"
                disabled={isLoadingUpdate}
              >
                {isLoadingUpdate && <Loader />}
                Update Profile
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default UpdateProfileWrapper;
