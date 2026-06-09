import type { Comment, PostTag } from "@nmm/shared";
import type { PostRecord } from "./board.model";

export const BOARD_QUERY_PROVIDER = Symbol("BOARD_QUERY_PROVIDER");
export const BOARD_COMMAND_PROVIDER = Symbol("BOARD_COMMAND_PROVIDER");

export type BoardQueryProvider = {
    listTags(): Promise<PostTag[]>;
    findTagsByIds(ids: string[]): Promise<PostTag[]>;
    listPosts(): Promise<PostRecord[]>;
    findPost(id: string): Promise<PostRecord | undefined>;
    listComments(postId: string): Promise<Comment[]>;
    findComment(postId: string, commentId: string): Promise<Comment | undefined>;
};

export type BoardCommandProvider = {
    createPostId(): string;
    createCommentId(): string;
    createPost(post: PostRecord): Promise<void>;
    savePost(post: PostRecord): Promise<void>;
    deletePostWithComments(post: PostRecord): Promise<void>;
    createComment(comment: Comment): Promise<void>;
    saveComment(comment: Comment): Promise<void>;
    deleteComment(comment: Comment): Promise<void>;
};
