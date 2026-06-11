import type { Comment, Post, User } from "@nmm/shared";
import { isActiveUser } from "@/features/auth";

export function canManagePost(user: User | null | undefined, post: Pick<Post, "authorId">) {
    return isActiveUser(user) && (user.role === "ADMIN" || user.id === post.authorId);
}

export function canManageComment(user: User | null | undefined, comment: Pick<Comment, "authorId">) {
    return isActiveUser(user) && (user.role === "ADMIN" || user.id === comment.authorId);
}
