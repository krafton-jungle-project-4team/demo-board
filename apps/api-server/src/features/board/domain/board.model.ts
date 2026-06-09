import type { Post, User } from "@nmm/shared";

export type PostRecord = Omit<Post, "tags"> & {
    tagIds: string[];
};

export type BoardUser = User & {
    name: string;
};
