import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { z } from "zod";
import { BoardPostListQuerySchema, BoardPostParamsSchema } from "@nmm/shared";
import { BoardDetailPage } from "@/pages/board/board-detail-page";

const BoardPostDetailSearchSchema = BoardPostListQuerySchema.extend({
    commentPage: z.coerce.number().int().min(1).optional().catch(undefined)
});

export const Route = createFileRoute("/board/$postId")({
    validateSearch: (search) => BoardPostDetailSearchSchema.parse(search),
    component: BoardPostRoute
});

function BoardPostRoute() {
    const { postId } = BoardPostParamsSchema.parse(Route.useParams());
    const { commentPage = 1, ...query } = Route.useSearch();
    const isBoardPostRouteLeaf = useRouterState({
        select: (state) => state.matches[state.matches.length - 1]?.routeId === "/board/$postId"
    });

    return isBoardPostRouteLeaf ? (
        <BoardDetailPage postId={postId} query={query} commentPage={commentPage} />
    ) : (
        <Outlet />
    );
}
