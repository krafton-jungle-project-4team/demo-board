import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
    CommentListResponseSchema,
    CreateCommentRequestSchema,
    CreateCommentResponseSchema,
    DeleteCommentResponseSchema,
    ResourceIdSchema,
    UpdateCommentRequestSchema,
    UpdateCommentResponseSchema,
    type CommentListResponse,
    type CreateCommentRequest,
    type CreateCommentResponse,
    type DeleteCommentResponse,
    type UpdateCommentRequest,
    type UpdateCommentResponse
} from "@nmm/shared";
import { ActiveAccountGuard, CurrentAuth, type AuthClaims } from "../../auth";
import { BoardCommandService } from "../service/board-command.service";
import { BoardQueryService } from "../service/board-query.service";

@Controller("posts/:postId/comments")
export class CommentsController {
    constructor(
        private readonly boardCommandService: BoardCommandService,
        private readonly boardQueryService: BoardQueryService
    ) {}

    @Get()
    async findComments(@Param("postId") postId: string): Promise<CommentListResponse> {
        const response: CommentListResponse = await this.boardQueryService.findComments(ResourceIdSchema.parse(postId));

        return CommentListResponseSchema.parse(response);
    }

    @Post()
    @UseGuards(ActiveAccountGuard)
    async createComment(
        @Param("postId") postId: string,
        @Body() body: unknown,
        @CurrentAuth() claims: AuthClaims
    ): Promise<CreateCommentResponse> {
        const parsedPostId = ResourceIdSchema.parse(postId);
        const request: CreateCommentRequest = CreateCommentRequestSchema.parse(body);
        const response: CreateCommentResponse = await this.boardCommandService.createComment(
            parsedPostId,
            request,
            claims
        );

        return CreateCommentResponseSchema.parse(response);
    }

    @Patch(":commentId")
    @UseGuards(ActiveAccountGuard)
    async updateComment(
        @Param("postId") postId: string,
        @Param("commentId") commentId: string,
        @Body() body: unknown,
        @CurrentAuth() claims: AuthClaims
    ): Promise<UpdateCommentResponse> {
        const parsedPostId = ResourceIdSchema.parse(postId);
        const parsedCommentId = ResourceIdSchema.parse(commentId);
        const request: UpdateCommentRequest = UpdateCommentRequestSchema.parse(body);
        const response: UpdateCommentResponse = await this.boardCommandService.updateComment(
            parsedPostId,
            parsedCommentId,
            request,
            claims
        );

        return UpdateCommentResponseSchema.parse(response);
    }

    @Delete(":commentId")
    @UseGuards(ActiveAccountGuard)
    async deleteComment(
        @Param("postId") postId: string,
        @Param("commentId") commentId: string,
        @CurrentAuth() claims: AuthClaims
    ): Promise<DeleteCommentResponse> {
        const response: DeleteCommentResponse = await this.boardCommandService.deleteComment(
            ResourceIdSchema.parse(postId),
            ResourceIdSchema.parse(commentId),
            claims
        );

        return DeleteCommentResponseSchema.parse(response);
    }
}
