import { Inject, Injectable } from "@nestjs/common";
import {
    DeleteCommentResponseSchema,
    DeletePostResponseSchema,
    type Comment,
    type CreateCommentRequest,
    type CreatePostRequest,
    type DeleteCommentResponse,
    type DeletePostResponse,
    type Post,
    type UpdateCommentRequest,
    type UpdatePostRequest
} from "@nmm/shared";
import { AuthQueryService } from "../../auth";
import type { AuthClaims } from "../../auth/domain";
import { BOARD_REPOSITORY, boardErrors, type BoardRepository } from "../domain";
import { BoardQueryService } from "./board-query.service";

@Injectable()
export class BoardCommandService {
    constructor(
        @Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository,
        private readonly boardQueryService: BoardQueryService,
        private readonly authQueryService: AuthQueryService
    ) {}

    async createPost(request: CreatePostRequest, claims: AuthClaims): Promise<Post> {
        const user = await this.authQueryService.requireCompletedUserRecord(claims);

        return this.boardQueryService.toPost(await this.boardRepository.createPost(request, user));
    }

    async updatePost(id: number, request: UpdatePostRequest, claims: AuthClaims): Promise<Post> {
        const post = await this.boardQueryService.findExistingPost(id);

        this.assertOwner(post, claims);

        return this.boardQueryService.toPost(await this.boardRepository.savePost(post, request));
    }

    async deletePost(id: number, claims: AuthClaims): Promise<DeletePostResponse> {
        const post = await this.boardQueryService.findExistingPost(id);

        this.assertOwner(post, claims);
        await this.boardRepository.deletePostWithComments(post);

        return DeletePostResponseSchema.parse({ ok: true, id });
    }

    async createComment(postId: number, request: CreateCommentRequest, claims: AuthClaims): Promise<Comment> {
        await this.boardQueryService.findExistingPost(postId);
        const user = await this.authQueryService.requireCompletedUserRecord(claims);

        return this.boardQueryService.toComment(await this.boardRepository.createComment(postId, request, user));
    }

    async updateComment(
        postId: number,
        commentId: number,
        request: UpdateCommentRequest,
        claims: AuthClaims
    ): Promise<Comment> {
        await this.boardQueryService.findExistingPost(postId);

        const comment = await this.boardQueryService.findExistingComment(postId, commentId);

        this.assertOwner(comment, claims);

        return this.boardQueryService.toComment(await this.boardRepository.saveComment(comment, request));
    }

    async deleteComment(postId: number, commentId: number, claims: AuthClaims): Promise<DeleteCommentResponse> {
        await this.boardQueryService.findExistingPost(postId);

        const comment = await this.boardQueryService.findExistingComment(postId, commentId);

        this.assertOwner(comment, claims);
        await this.boardRepository.deleteComment(comment);

        return DeleteCommentResponseSchema.parse({ ok: true, id: commentId });
    }

    private assertOwner(resource: { authorId: string }, claims: Pick<AuthClaims, "role" | "userId">) {
        if (resource.authorId !== claims.userId && claims.role !== "ADMIN") {
            throw boardErrors.notResourceOwner();
        }
    }
}
