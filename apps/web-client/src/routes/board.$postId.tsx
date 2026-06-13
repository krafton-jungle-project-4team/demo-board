import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { BoardPostParamsSchema } from "@nmm/shared";
import { BoardDetailPage } from "@/pages/board/board-detail-page";

export const Route = createFileRoute("/board/$postId")({
    component: BoardPostRoute
});

function BoardPostRoute() {
    const { postId } = BoardPostParamsSchema.parse(Route.useParams());
    const isBoardPostRouteLeaf = useRouterState({
        select: (state) => state.matches[state.matches.length - 1]?.routeId === "/board/$postId"
    });

    return isBoardPostRouteLeaf ? <BoardDetailPage postId={postId} /> : <Outlet />;
}
