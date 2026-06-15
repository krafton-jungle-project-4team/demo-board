import { createFileRoute } from "@tanstack/react-router";
import { BoardPostListQuerySchema } from "@nmm/shared";
import { BoardNewPage } from "@/pages/board/board-new-page";

export const Route = createFileRoute("/board/new")({
    validateSearch: (search) => BoardPostListQuerySchema.parse(search),
    component: BoardNewRoute
});

function BoardNewRoute() {
    const query = Route.useSearch();

    return <BoardNewPage query={query} />;
}
