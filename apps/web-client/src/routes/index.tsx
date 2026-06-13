import { createFileRoute } from "@tanstack/react-router";
import { PostsPage } from "@/pages/posts/posts-page";

export const Route = createFileRoute("/")({
    component: PostsPage
});
