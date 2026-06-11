import { createFileRoute } from "@tanstack/react-router";
import { PostDetailPage } from "@/pages/posts/post-detail-page";

// 파일 라우트의 $postId 파라미터를 읽어 상세 페이지에 전달한다.
export const Route = createFileRoute("/posts_/$postId")({
    component: RouteComponent
});

function RouteComponent() {
    const { postId } = Route.useParams();

    return <PostDetailPage postId={postId} />;
}
