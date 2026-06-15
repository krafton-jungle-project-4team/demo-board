import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { BoardPostListQuerySchema, BoardPostParamsSchema } from "@nmm/shared";
import { BoardDetailPage } from "@/pages/board/board-detail-page";

export const Route = createFileRoute("/board/$postId")({
    validateSearch: (search) => BoardPostListQuerySchema.parse(search),
    component: BoardPostRoute
});

function BoardPostRoute() {
    const { postId } = BoardPostParamsSchema.parse(Route.useParams());
    const query = Route.useSearch();
    const isBoardPostRouteLeaf = useRouterState({
        select: (state) => state.matches[state.matches.length - 1]?.routeId === "/board/$postId"
    });

    return isBoardPostRouteLeaf ? <BoardDetailPage postId={postId} query={query} /> : <Outlet />;
}
