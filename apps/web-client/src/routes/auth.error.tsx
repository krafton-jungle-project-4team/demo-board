import { createFileRoute } from "@tanstack/react-router";
import { AuthErrorPage } from "@/pages/auth/auth-error-page";

// 인증 오류 화면을 /auth/error 경로에 연결한다.
export const Route = createFileRoute("/auth/error")({
    component: AuthErrorPage
});
