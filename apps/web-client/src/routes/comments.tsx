import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { CommentPage } from "@/pages/comment/comment-page";

const CommentRouteSearchSchema = z.object({
    postId: z.coerce.number().int().positive().default(1),
    page: z.coerce.number().int().positive().default(1)
});

export const Route = createFileRoute("/comments")({
    validateSearch: (search) => CommentRouteSearchSchema.parse(search),
    component: CommentRoute
});

function CommentRoute() {
    const search = Route.useSearch();
    const navigate = useNavigate({ from: "/comments" });

    function handlePageChange(page: number) {
        void navigate({
            search: {
                postId: search.postId,
                page
            }
        });
    }

    return <CommentPage postId={search.postId} page={search.page} onPageChange={handlePageChange} />;
}
