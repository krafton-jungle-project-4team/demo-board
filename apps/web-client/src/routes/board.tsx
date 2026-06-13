import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { BoardPostListQuerySchema } from "@nmm/shared";
import { BoardListPage } from "@/pages/board/board-list-page";

export const Route = createFileRoute("/board")({
    validateSearch: (search) => BoardPostListQuerySchema.parse(search),
    component: BoardRoute
});

function BoardRoute() {
    const query = Route.useSearch();
    const isBoardRouteLeaf = useRouterState({
        select: (state) => state.matches[state.matches.length - 1]?.routeId === "/board"
    });

    return isBoardRouteLeaf ? <BoardListPage query={query} /> : <Outlet />;
}
