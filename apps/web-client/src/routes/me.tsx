import { createFileRoute } from "@tanstack/react-router";
import { MyProfilePage } from "@/pages/auth/my-profile-page";

export const Route = createFileRoute("/me")({
    component: MyProfilePage
});
