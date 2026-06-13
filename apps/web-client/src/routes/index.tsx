import { Navigate, createFileRoute } from "@tanstack/react-router";
import { BoardPostListQuerySchema } from "@nmm/shared";

const defaultBoardPostListSearch = BoardPostListQuerySchema.parse({});

export const Route = createFileRoute("/")({
    component: IndexRoute
});

function IndexRoute() {
    return <Navigate to="/board" search={defaultBoardPostListSearch} replace />;
}
