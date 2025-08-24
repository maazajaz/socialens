"use client";

import React from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate } from "react-router-dom";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { Textarea, Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { PRIVACY_SETTINGS } from "@/constants";


import { ProfileValidation } from "@/lib/validation";
import { useUserContext } from "@/context/SupabaseAuthContext";
import { useGetUserById, useUpdateUser, useGetCurrentUser } from "@/lib/react-query/queriesAndMutations";
import Loader from "@/components/shared/Loader";
import ProfileUploader from "@/components/shared/ProfileUploder";

const UpdateProfile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, setUser } = useUserContext();
  
  const userId = Array.isArray(id) ? id[0] : id;
  // Queries
  const { data: currentUser } = useGetUserById(userId || "");
  const { refetch: refetchCurrentUser } = useGetCurrentUser();
  const { mutateAsync: updateUser, isPending: isLoadingUpdate } =
    useUpdateUser();

  const form = useForm<z.infer<typeof ProfileValidation>>({
    resolver: zodResolver(ProfileValidation),
    defaultValues: {
      file: [],
      name: currentUser?.name || "",
      username: currentUser?.username || "",
      email: currentUser?.email || "",
      bio: currentUser?.bio || "",
      privacy_setting: currentUser?.privacy_setting || "public",
    },
  });

  // Update form when currentUser data loads
  React.useEffect(() => {
    if (currentUser) {
      form.reset({
        file: [],
        name: currentUser.name || "",
        username: currentUser.username || "",
        email: currentUser.email || "",
        bio: currentUser.bio || "",
        privacy_setting: currentUser.privacy_setting || "public",
      });
    }
  }, [currentUser, form]);

  if (!currentUser)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  // Handler
  const handleUpdate = async (value: z.infer<typeof ProfileValidation>) => {
    try {
      const updatedUser = await updateUser({
        userId: currentUser.id,
        name: value.name,
        username: value.username,
        email: value.email,
        bio: value.bio,
        privacy_setting: value.privacy_setting,
        file: value.file,
        imageUrl: currentUser.image_url,
      });

      if (!updatedUser) {
        toast({
          title: `Update user failed. Please try again.`,
        });
        return;
      }

      if (user) {
        setUser({
          ...user,
          name: updatedUser?.name || user.name,
          username: updatedUser?.username || user.username,
          email: updatedUser?.email || user.email,
          bio: updatedUser?.bio || user.bio,
          privacy_setting: updatedUser?.privacy_setting || user.privacy_setting,
          image_url: updatedUser?.image_url || user.image_url,
        });
      }
      
      // Force refresh current user data
      await refetchCurrentUser();
      
      toast({
        title: "Profile updated successfully!",
      });
      
      navigate(`/profile/${userId}`);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: `Update user failed. Please try again.`,
      });
    }
  };

  return (
    <div className="flex flex-1">
      <div className="common-container md:pt-12">
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
            className="flex flex-col gap-7 w-full mt-4 max-w-5xl">
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

            <FormField
              control={form.control}
              name="privacy_setting"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Privacy Setting</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="shad-input">
                        <SelectValue placeholder="Select privacy level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRIVACY_SETTINGS.map((setting) => (
                        <SelectItem key={setting.value} value={setting.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{setting.label}</span>
                            <span className="text-sm text-light-3">{setting.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            <div className="flex gap-4 items-center justify-end mobile-bottom-spacing">
              <Button
                type="button"
                className="shad-button_dark_4"
                onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="shad-button_primary whitespace-nowrap"
                disabled={isLoadingUpdate}>
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

export default UpdateProfile;
