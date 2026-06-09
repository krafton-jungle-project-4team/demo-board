import { Inject, Injectable } from "@nestjs/common";
import {
    CommentSchema,
    DeleteCommentResponseSchema,
    DeletePostResponseSchema,
    type Comment,
    type CreateCommentRequest,
    type CreatePostRequest,
    type DeleteCommentResponse,
    type DeletePostResponse,
    type Post,
    type UpdateCommentRequest,
    type UpdatePostRequest,
    type User
} from "@nmm/shared";
import { BOARD_REPOSITORY, boardErrors, type BoardRepository, type BoardUser, type NewPostRecord } from "../domain";
import { BoardQueryService } from "./board-query.service";

@Injectable()
export class BoardCommandService {
    constructor(
        @Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository,
        private readonly boardQueryService: BoardQueryService
    ) {}

    async createPost(request: CreatePostRequest, user: BoardUser): Promise<Post> {
        const now = new Date().toISOString();
        const post: NewPostRecord = {
            title: request.title,
            excerpt: request.excerpt,
            content: request.content,
            authorId: user.id,
            authorName: user.name,
            createdAt: now,
            updatedAt: now,
            tagIds: await this.boardQueryService.resolveTagIds(request.tagIds)
        };

        const savedPost = await this.boardRepository.createPost(post);

        return this.boardQueryService.toPost(savedPost);
    }

    async updatePost(id: number, request: UpdatePostRequest, user: BoardUser): Promise<Post> {
        const post = await this.boardQueryService.findPostRecord(id);

        this.assertOwner(post, user);

        if (request.title !== undefined) {
            post.title = request.title;
        }

        if (request.excerpt !== undefined) {
            post.excerpt = request.excerpt;
        }

        if (request.content !== undefined) {
            post.content = request.content;
        }

        if (request.tagIds !== undefined) {
            post.tagIds = await this.boardQueryService.resolveTagIds(request.tagIds);
        }

        post.updatedAt = new Date().toISOString();
        await this.boardRepository.savePost(post);

        return this.boardQueryService.toPost(post);
    }

    async deletePost(id: number, user: BoardUser): Promise<DeletePostResponse> {
        const post = await this.boardQueryService.findPostRecord(id);

        this.assertOwner(post, user);
        await this.boardRepository.deletePostWithComments(post);

        return DeletePostResponseSchema.parse({ ok: true, id });
    }

    async createComment(postId: number, request: CreateCommentRequest, user: BoardUser): Promise<Comment> {
        await this.boardQueryService.findPostRecord(postId);

        const now = new Date().toISOString();
        const comment = await this.boardRepository.createComment({
            postId,
            content: request.content,
            authorId: user.id,
            authorName: user.name,
            createdAt: now,
            updatedAt: now
        });

        return CommentSchema.parse(comment);
    }

    async updateComment(
        postId: number,
        commentId: number,
        request: UpdateCommentRequest,
        user: BoardUser
    ): Promise<Comment> {
        await this.boardQueryService.findPostRecord(postId);

        const comment = await this.boardQueryService.findCommentRecord(postId, commentId);

        this.assertOwner(comment, user);

        if (request.content !== undefined) {
            comment.content = request.content;
        }

        comment.updatedAt = new Date().toISOString();
        await this.boardRepository.saveComment(comment);

        return CommentSchema.parse(comment);
    }

    async deleteComment(postId: number, commentId: number, user: BoardUser): Promise<DeleteCommentResponse> {
        await this.boardQueryService.findPostRecord(postId);

        const comment = await this.boardQueryService.findCommentRecord(postId, commentId);

        this.assertOwner(comment, user);
        await this.boardRepository.deleteComment(comment);

        return DeleteCommentResponseSchema.parse({ ok: true, id: commentId });
    }

    private assertOwner(resource: { authorId: string }, user: User) {
        if (resource.authorId !== user.id && user.role !== "ADMIN") {
            throw boardErrors.notResourceOwner();
        }
    }
}
