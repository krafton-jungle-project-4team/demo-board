import { createFileRoute } from "@tanstack/react-router";
import { PostDetailPage } from "@/pages/posts/post-detail-page";

export const Route = createFileRoute("/posts_/$postId")({
  component: RouteComponent
});

function RouteComponent() {
  const { postId } = Route.useParams();

  return <PostDetailPage postId={postId} />;
}
