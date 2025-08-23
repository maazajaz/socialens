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
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui";
import { useCreatePost, useUpdatePost } from "@/lib/react-query/queriesAndMutations";

type PostFormProps = {
  post?: any; // TODO: Add proper Supabase Post type
  action: "Create" | "Update";
};

const PostForm = ({ post, action }: PostFormProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUserContext();
  const form = useForm<z.infer<typeof PostValidation>>({
    resolver: zodResolver(PostValidation),
    defaultValues: {
      caption: post ? post?.caption : "",
      file: [],
      location: post ? post.location : "",
      tags: post ? (Array.isArray(post.tags) ? post.tags.join(",") : post.tags || "") : "",
    },
  });

  // Query
  const { mutateAsync: createPost, isPending: isLoadingCreate } =
    useCreatePost();
  const { mutateAsync: updatePost, isPending: isLoadingUpdate } =
    useUpdatePost();

  // Handler
  const handleSubmit = async (value: z.infer<typeof PostValidation>) => {
    console.log('PostForm - Current user:', user)
    console.log('PostForm - User ID:', user?.id)
    
    if (!user?.id) {
      toast({
        title: "Authentication required. Please login again.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // ACTION = UPDATE
      if (post && action === "Update") {
        const updatedPost = await updatePost({
          ...value,
          postId: post.id,
          imageUrl: post.image_url,
        });

        if (!updatedPost) {
          toast({
            title: `${action} post failed. Please try again.`,
          });
          return;
        }
        
        toast({
          title: `Post ${action.toLowerCase()}d successfully!`,
        });
        return router.push(`/posts/${post.id}`);
      }

      // ACTION = CREATE
      console.log('PostForm - About to create post with userId:', user.id)
      const newPost = await createPost({
        ...value,
        userId: user.id,
      });

      if (!newPost) {
        toast({
          title: `${action} post failed. Please try again.`,
        });
        return;
      }
      
      toast({
        title: `Post ${action.toLowerCase()}d successfully!`,
      });
      router.push("/");
    } catch (error) {
      console.error(`Error ${action.toLowerCase()}ing post:`, error);
      toast({
        title: `${action} post failed. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-9 w-full  max-w-5xl">
        <FormField
          control={form.control}
          name="caption"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Caption</FormLabel>
              <FormControl>
                <Textarea
                  className="shad-textarea custom-scrollbar"
                  style={{ height: '80px', minHeight: '80px' }}
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

        <div className="flex gap-4 items-center justify-end pt-6 pb-8 mb-6">
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

export default PostForm;
