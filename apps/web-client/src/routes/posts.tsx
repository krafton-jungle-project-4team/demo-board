import { createFileRoute } from "@tanstack/react-router";
import { postSearchSchema } from "@/features/posts";
import { PostsPage } from "@/pages/posts/posts-page";

export const Route = createFileRoute("/posts")({
  validateSearch: postSearchSchema,
  component: PostsPage
});
