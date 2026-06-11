import type { User } from "@nmm/shared";

type ActiveUser = User & { status: "ACTIVE" };
type CompleteActiveProfileUser = ActiveUser & { name: string };

export function isActiveUser(user: User | null | undefined): user is ActiveUser {
    return user?.status === "ACTIVE";
}

export function hasCompleteActiveProfile(user: User | null | undefined): user is CompleteActiveProfileUser {
    return isActiveUser(user) && user.name !== null && user.name.length > 0;
}
