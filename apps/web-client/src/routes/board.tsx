import { createFileRoute } from "@tanstack/react-router";
import { BoardPostListQuerySchema } from "@nmm/shared";
import { BoardListPage } from "@/pages/board/board-list-page";

export const Route = createFileRoute("/board")({
    validateSearch: (search) => BoardPostListQuerySchema.parse(search),
    component: BoardRoute
});

function BoardRoute() {
    const query = Route.useSearch();

    return <BoardListPage query={query} />;
}
