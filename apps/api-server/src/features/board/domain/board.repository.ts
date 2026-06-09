import type {
    Comment,
    CreateCommentRequest,
    CreatePostRequest,
    Post,
    PostTag,
    UpdateCommentRequest,
    UpdatePostRequest
} from "@nmm/shared";
import type { BoardUser } from "./board.model";

export const BOARD_REPOSITORY = Symbol("BOARD_REPOSITORY");

export type BoardRepository = {
    listTags(): Promise<PostTag[]>;
    listPosts(): Promise<Post[]>;
    findPost(id: number): Promise<Post | undefined>;
    listComments(postId: number): Promise<Comment[]>;
    findComment(postId: number, commentId: number): Promise<Comment | undefined>;
    createPost(request: CreatePostRequest, user: BoardUser): Promise<Post>;
    savePost(post: Post, request: UpdatePostRequest): Promise<Post>;
    deletePostWithComments(post: Post): Promise<void>;
    createComment(postId: number, request: CreateCommentRequest, user: BoardUser): Promise<Comment>;
    saveComment(comment: Comment, request: UpdateCommentRequest): Promise<Comment>;
    deleteComment(comment: Comment): Promise<void>;
};
