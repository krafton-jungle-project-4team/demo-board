import type { Post, User } from "@nmm/shared";

export function canManagePost(user: User | null | undefined, post: Pick<Post, "authorId">) {
    return user?.status === "ACTIVE" && (user.role === "ADMIN" || user.id === post.authorId);
}
