import { createFileRoute, redirect } from "@tanstack/react-router";

// 루트 경로로 들어오면 게시글 목록으로 보낸다.
export const Route = createFileRoute("/")({
    beforeLoad: () => {
        throw redirect({
            to: "/posts"
        });
    }
});
