import { createFileRoute } from "@tanstack/react-router";
import { BoardPostParamsSchema } from "@nmm/shared";
import { BoardDetailPage } from "@/pages/board/board-detail-page";

export const Route = createFileRoute("/board/$postId")({
    component: BoardPostRoute
});

function BoardPostRoute() {
    const { postId } = BoardPostParamsSchema.parse(Route.useParams());

    return <BoardDetailPage postId={postId} />;
}
