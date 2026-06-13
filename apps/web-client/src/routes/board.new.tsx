import { createFileRoute } from "@tanstack/react-router";
import { BoardNewPage } from "@/pages/board/board-new-page";

export const Route = createFileRoute("/board/new")({
    component: BoardNewPage
});
