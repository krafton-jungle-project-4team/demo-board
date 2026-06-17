import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { BoardPostListQuerySchema } from "@nmm/shared";
import { ProfilePage } from "@/pages/profile/profile-page";

const ProfileSearchSchema = BoardPostListQuerySchema.extend({
    redirectTo: z.enum(["boardNew"]).optional()
});

export const Route = createFileRoute("/profile")({
    validateSearch: (search) => ProfileSearchSchema.parse(search),
    component: ProfileRoute
});

function ProfileRoute() {
    const query = Route.useSearch();

    return <ProfilePage query={query} />;
}
