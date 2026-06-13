import { createFileRoute } from "@tanstack/react-router";
import { BoardPostParamsSchema } from "@nmm/shared";
import { BoardEditPage } from "@/pages/board/board-edit-page";

export const Route = createFileRoute("/board/$postId/edit")({
    component: BoardPostEditRoute
});

function BoardPostEditRoute() {
    const { postId } = BoardPostParamsSchema.parse(Route.useParams());

    return <BoardEditPage postId={postId} />;
}
