import { createFileRoute } from "@tanstack/react-router";
import { PostCreatePage } from "@/pages/posts/post-create-page";

// 새 게시글 작성 화면을 /posts/new 경로에 연결한다.
export const Route = createFileRoute("/posts_/new")({
    component: PostCreatePage
});
