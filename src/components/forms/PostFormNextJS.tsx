"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { PostValidation } from "@/lib/validation";
import { useToast } from "@/components/ui/use-toast";
import { useUserContext } from "@/context/SupabaseAuthContext";
import FileUploader from "../shared/FileUploader";
import Loader from "../shared/Loader";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useUpdatePost, useCreatePost } from "@/lib/react-query/queriesAndMutations";
import { POST_CATEGORIES } from "@/constants";

type PostFormNextJSProps = {
  post?: any; // Post data from Supabase
  action: "Create" | "Update";
};

const PostFormNextJS = ({ post, action }: PostFormNextJSProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUserContext();
  const form = useForm<z.infer<typeof PostValidation>>({
    resolver: zodResolver(PostValidation),
    defaultValues: {
      caption: post ? post?.caption : "",
      file: [],
      location: post ? post.location : "",
      tags: post ? post.tags.join(",") : "",
      category: post ? post.category : "general",
    },
  });

  // Query
  const { mutateAsync: createPost, isPending: isLoadingCreate } = useCreatePost();
  const { mutateAsync: updatePost, isPending: isLoadingUpdate } = useUpdatePost();

  // Handler
  const handleSubmit = async (value: z.infer<typeof PostValidation>) => {
    console.log("Form submitted with values:", value);
    console.log("Current user:", user);
    console.log("Action:", action);

    // ACTION = UPDATE
    if (post && action === "Update") {
      console.log("Updating post:", post.id);
      try {
        const updatedPost = await updatePost({
          postId: post.id,
          caption: value.caption,
          imageUrl: post.imageUrl,
          file: value.file,
          location: value.location,
          tags: value.tags,
          category: value.category,
        });

        console.log("Updated post result:", updatedPost);

        if (!updatedPost) {
          console.error("Failed to update post");
          toast({
            title: `${action} post failed. Please try again.`,
          });
          return;
        }
        console.log("Navigating to post detail page:", updatedPost.id);
        return router.push(`/posts/${updatedPost.id}`);
      } catch (error) {
        console.error("Error updating post:", error);
        toast({
          title: `${action} post failed. Please try again.`,
        });
        return;
      }
    }

    // ACTION = CREATE
    console.log("Creating new post");
    if (!user) {
      toast({ title: "User not authenticated" });
      return;
    }
    
    try {
      const newPost = await createPost({
        userId: user.id,
        caption: value.caption,
        file: value.file,
        location: value.location,
        tags: value.tags,
        category: value.category,
      });

      console.log("Created post result:", newPost);

      if (!newPost) {
        console.error("Failed to create post");
        toast({
          title: `${action} post failed. Please try again.`,
        });
        return;
      }

      console.log("Navigating to home page");
      router.push("/");
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: `${action} post failed. Please try again.`,
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-9 w-full max-w-5xl">
        <FormField
          control={form.control}
          name="caption"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Caption</FormLabel>
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
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Add Photos</FormLabel>
              <FormControl>
                <FileUploader
                  fieldChange={field.onChange}
                  mediaUrl={post?.imageUrl}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Add Location</FormLabel>
              <FormControl>
                <Input type="text" className="shad-input" {...field} />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">
                Add Tags (separated by comma " , ")
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Art, Expression, Learn"
                  type="text"
                  className="shad-input"
                  {...field}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Category *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="shad-input">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POST_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <div className="flex gap-4 items-center justify-end pt-6 pb-4">
          <Button
            type="button"
            className="shad-button_dark_4"
            onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="shad-button_primary whitespace-nowrap"
            disabled={isLoadingCreate || isLoadingUpdate}>
            {(isLoadingCreate || isLoadingUpdate) && <Loader />}
            {action} Post
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PostFormNextJS;
