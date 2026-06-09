import type { Comment, PostTag } from "@nmm/shared";
import type { NewCommentRecord, NewPostRecord, PostRecord } from "./board.model";

export const BOARD_REPOSITORY = Symbol("BOARD_REPOSITORY");

export type BoardRepository = {
    listTags(): Promise<PostTag[]>;
    findTagsByIds(ids: number[]): Promise<PostTag[]>;
    listPosts(): Promise<PostRecord[]>;
    findPost(id: number): Promise<PostRecord | undefined>;
    listComments(postId: number): Promise<Comment[]>;
    findComment(postId: number, commentId: number): Promise<Comment | undefined>;
    createPost(post: NewPostRecord): Promise<PostRecord>;
    savePost(post: PostRecord): Promise<void>;
    deletePostWithComments(post: PostRecord): Promise<void>;
    createComment(comment: NewCommentRecord): Promise<Comment>;
    saveComment(comment: Comment): Promise<void>;
    deleteComment(comment: Comment): Promise<void>;
};
