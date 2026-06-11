import { createFileRoute } from "@tanstack/react-router";
import { PostEditPage } from "@/pages/posts/post-edit-page";

// URL의 $postId를 읽어 게시글 수정 페이지에 전달한다.
export const Route = createFileRoute("/posts_/$postId_/edit")({
    component: RouteComponent
});

function RouteComponent() {
    const { postId } = Route.useParams();

    return <PostEditPage postId={postId} />;
}
