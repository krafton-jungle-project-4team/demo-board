import { Inject, Injectable } from "@nestjs/common";
import {
    CommentSchema,
    CreateCommentRequestSchema,
    CreatePostRequestSchema,
    DeleteCommentResponseSchema,
    DeletePostResponseSchema,
    UpdateCommentRequestSchema,
    UpdatePostRequestSchema,
    type Comment,
    type DeleteCommentResponse,
    type DeletePostResponse,
    type Post,
    type User
} from "@nmm/shared";
import {
    BOARD_COMMAND_PROVIDER,
    boardErrors,
    type BoardCommandProvider,
    type BoardUser,
    type PostRecord
} from "../domain";
import { BoardQueryService } from "./board-query.service";

@Injectable()
export class BoardCommandService {
    constructor(
        @Inject(BOARD_COMMAND_PROVIDER) private readonly boardCommandProvider: BoardCommandProvider,
        private readonly boardQueryService: BoardQueryService
    ) {}

    async createPost(input: unknown, user: BoardUser): Promise<Post> {
        const request = CreatePostRequestSchema.parse(input);
        const now = new Date().toISOString();
        const post: PostRecord = {
            id: this.boardCommandProvider.createPostId(),
            title: request.title,
            excerpt: request.excerpt,
            content: request.content,
            authorId: user.id,
            authorName: user.name,
            createdAt: now,
            updatedAt: now,
            tagIds: await this.boardQueryService.resolveTagIds(request.tagIds)
        };

        await this.boardCommandProvider.createPost(post);

        return this.boardQueryService.toPost(post);
    }

    async updatePost(id: string, input: unknown, user: BoardUser): Promise<Post> {
        const request = UpdatePostRequestSchema.parse(input);
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
        await this.boardCommandProvider.savePost(post);

        return this.boardQueryService.toPost(post);
    }

    async deletePost(id: string, user: BoardUser): Promise<DeletePostResponse> {
        const post = await this.boardQueryService.findPostRecord(id);

        this.assertOwner(post, user);
        await this.boardCommandProvider.deletePostWithComments(post);

        return DeletePostResponseSchema.parse({ ok: true, id });
    }

    async createComment(postId: string, input: unknown, user: BoardUser): Promise<Comment> {
        await this.boardQueryService.findPostRecord(postId);

        const request = CreateCommentRequestSchema.parse(input);
        const now = new Date().toISOString();
        const comment = CommentSchema.parse({
            id: this.boardCommandProvider.createCommentId(),
            postId,
            content: request.content,
            authorId: user.id,
            authorName: user.name,
            createdAt: now,
            updatedAt: now
        });

        await this.boardCommandProvider.createComment(comment);

        return comment;
    }

    async updateComment(postId: string, commentId: string, input: unknown, user: BoardUser): Promise<Comment> {
        await this.boardQueryService.findPostRecord(postId);

        const request = UpdateCommentRequestSchema.parse(input);
        const comment = await this.boardQueryService.findCommentRecord(postId, commentId);

        this.assertOwner(comment, user);

        if (request.content !== undefined) {
            comment.content = request.content;
        }

        comment.updatedAt = new Date().toISOString();
        await this.boardCommandProvider.saveComment(comment);

        return CommentSchema.parse(comment);
    }

    async deleteComment(postId: string, commentId: string, user: BoardUser): Promise<DeleteCommentResponse> {
        await this.boardQueryService.findPostRecord(postId);

        const comment = await this.boardQueryService.findCommentRecord(postId, commentId);

        this.assertOwner(comment, user);
        await this.boardCommandProvider.deleteComment(comment);

        return DeleteCommentResponseSchema.parse({ ok: true, id: commentId });
    }

    private assertOwner(resource: { authorId: string }, user: User) {
        if (resource.authorId !== user.id && user.role !== "ADMIN") {
            throw boardErrors.notResourceOwner();
        }
    }
}
