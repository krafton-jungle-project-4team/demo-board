import type { Comment, Post, User } from "@nmm/shared";

export type PostRecord = Omit<Post, "tags"> & {
    tagIds: number[];
};

export type NewPostRecord = Omit<PostRecord, "id">;

export type NewCommentRecord = Omit<Comment, "id">;

export type BoardUser = User & {
    name: string;
};
