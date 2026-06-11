import { createFileRoute } from "@tanstack/react-router";
import { CompleteSignUpPage } from "@/pages/auth/complete-signup-page";

// 회원가입 완료 화면을 /auth/complete-signup 경로에 연결한다.
export const Route = createFileRoute("/auth/complete-signup")({
    component: CompleteSignUpPage
});
