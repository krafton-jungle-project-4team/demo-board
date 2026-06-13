import { createFileRoute } from "@tanstack/react-router";
import { PostListQuerySchema } from "@nmm/shared";
import { PostListPage } from "@/pages/post-list/post-list-page";

export const Route = createFileRoute("/")({
    validateSearch: (search) => PostListQuerySchema.parse(search),
    component: IndexRoute
});

function IndexRoute() {
    const query = Route.useSearch();

    return <PostListPage query={query} />;
}
