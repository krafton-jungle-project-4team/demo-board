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
    type UpdatePostRequest,
    type User
} from "@nmm/shared";
import type { ActiveUser } from "../../auth/domain";
import { BOARD_REPOSITORY, boardErrors, type BoardRepository } from "../domain";
import { BoardQueryService } from "./board-query.service";

@Injectable()
export class BoardCommandService {
    constructor(
        @Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository,
        private readonly boardQueryService: BoardQueryService
    ) {}

    async createPost(request: CreatePostRequest, user: ActiveUser): Promise<Post> {
        return this.boardQueryService.toPost(await this.boardRepository.createPost(request, user));
    }

    async updatePost(id: number, request: UpdatePostRequest, user: ActiveUser): Promise<Post> {
        const post = await this.boardQueryService.findExistingPost(id);

        this.assertOwner(post, user);

        return this.boardQueryService.toPost(await this.boardRepository.savePost(post, request));
    }

    async deletePost(id: number, user: ActiveUser): Promise<DeletePostResponse> {
        const post = await this.boardQueryService.findExistingPost(id);

        this.assertOwner(post, user);
        await this.boardRepository.deletePostWithComments(post);

        return DeletePostResponseSchema.parse({ ok: true, id });
    }

    async createComment(postId: number, request: CreateCommentRequest, user: ActiveUser): Promise<Comment> {
        await this.boardQueryService.findExistingPost(postId);

        return this.boardQueryService.toComment(await this.boardRepository.createComment(postId, request, user));
    }

    async updateComment(
        postId: number,
        commentId: number,
        request: UpdateCommentRequest,
        user: ActiveUser
    ): Promise<Comment> {
        await this.boardQueryService.findExistingPost(postId);

        const comment = await this.boardQueryService.findExistingComment(postId, commentId);

        this.assertOwner(comment, user);

        return this.boardQueryService.toComment(await this.boardRepository.saveComment(comment, request));
    }

    async deleteComment(postId: number, commentId: number, user: ActiveUser): Promise<DeleteCommentResponse> {
        await this.boardQueryService.findExistingPost(postId);

        const comment = await this.boardQueryService.findExistingComment(postId, commentId);

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
