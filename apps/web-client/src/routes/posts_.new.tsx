import { createFileRoute } from "@tanstack/react-router";
import { PostCreatePage } from "@/pages/posts/post-create-page";

export const Route = createFileRoute("/posts_/new")({
    component: PostCreatePage
});
