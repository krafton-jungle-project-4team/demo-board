import { createFileRoute } from "@tanstack/react-router";
import { MyProfilePage } from "@/pages/auth/my-profile-page";

// 내 프로필 화면을 /me 경로에 연결한다.
export const Route = createFileRoute("/me")({
    component: MyProfilePage
});
