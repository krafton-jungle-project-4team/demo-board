import { createFileRoute } from "@tanstack/react-router";
import { CompleteSignUpPage } from "@/pages/auth/complete-signup-page";

export const Route = createFileRoute("/auth/complete-signup")({
    component: CompleteSignUpPage
});
