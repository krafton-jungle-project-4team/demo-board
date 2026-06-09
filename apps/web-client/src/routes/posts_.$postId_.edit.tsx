import { createFileRoute } from "@tanstack/react-router";
import { PostEditPage } from "@/pages/posts/post-edit-page";

export const Route = createFileRoute("/posts_/$postId_/edit")({
    component: RouteComponent
});

function RouteComponent() {
    const { postId } = Route.useParams();

    return <PostEditPage postId={postId} />;
}
