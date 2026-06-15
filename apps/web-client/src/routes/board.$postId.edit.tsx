import { createFileRoute } from "@tanstack/react-router";
import { BoardPostListQuerySchema, BoardPostParamsSchema } from "@nmm/shared";
import { BoardEditPage } from "@/pages/board/board-edit-page";

export const Route = createFileRoute("/board/$postId/edit")({
    validateSearch: (search) => BoardPostListQuerySchema.parse(search),
    component: BoardPostEditRoute
});

function BoardPostEditRoute() {
    const { postId } = BoardPostParamsSchema.parse(Route.useParams());
    const query = Route.useSearch();

    return <BoardEditPage postId={postId} query={query} />;
}
