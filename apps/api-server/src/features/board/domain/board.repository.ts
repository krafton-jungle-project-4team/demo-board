import type { CreateCommentRequest, CreatePostRequest, UpdateCommentRequest, UpdatePostRequest } from "@nmm/shared";
import type { ActiveUser } from "../../auth/domain";
import type { CommentEntity } from "./comment.entity";
import type { PostEntity } from "./post.entity";
import type { PostTagEntity } from "./post-tag.entity";

export const BOARD_REPOSITORY = Symbol("BOARD_REPOSITORY");

export type BoardRepository = {
    listTags(): Promise<PostTagEntity[]>;
    listPostTags(postId: number): Promise<PostTagEntity[]>;
    listPosts(): Promise<PostEntity[]>;
    findPost(id: number): Promise<PostEntity | undefined>;
    listComments(postId: number): Promise<CommentEntity[]>;
    findComment(postId: number, commentId: number): Promise<CommentEntity | undefined>;
    createPost(request: CreatePostRequest, user: ActiveUser): Promise<PostEntity>;
    savePost(post: PostEntity, request: UpdatePostRequest): Promise<PostEntity>;
    deletePostWithComments(post: PostEntity): Promise<void>;
    createComment(postId: number, request: CreateCommentRequest, user: ActiveUser): Promise<CommentEntity>;
    saveComment(comment: CommentEntity, request: UpdateCommentRequest): Promise<CommentEntity>;
    deleteComment(comment: CommentEntity): Promise<void>;
};
