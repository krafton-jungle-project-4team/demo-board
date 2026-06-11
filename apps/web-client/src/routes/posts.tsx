import { createFileRoute } from "@tanstack/react-router";
import { postSearchSchema } from "@/features/posts/model/post-search";
import { PostsPage } from "@/pages/posts/posts-page";

// /posts의 URL search params를 검증해 목록 페이지에서 타입 안전하게 사용한다.
export const Route = createFileRoute("/posts")({
    validateSearch: postSearchSchema,
    component: PostsPage
});
