import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
    CommentListQuerySchema,
    CreateCommentRequestSchema,
    UpdateCommentRequestSchema,
    type CommentCommandResponse,
    type CommentListResponse
} from "@nmm/shared";
import { z } from "zod";
import { CommentCommandService } from "../service/comment-command.service";
import { CommentQueryService } from "../service/comment-query.service";

const PositiveIntParamSchema = z.coerce.number().int().positive();

@Controller()
export class CommentController {
    constructor(
        private readonly commentQueryService: CommentQueryService,
        private readonly commentCommandService: CommentCommandService
    ) {}

    @Get("posts/:postId/comments")
    getComments(@Param("postId") postId: string, @Query() query: unknown): Promise<CommentListResponse> {
        return this.commentQueryService.getComments(
            PositiveIntParamSchema.parse(postId),
            CommentListQuerySchema.parse(query)
        );
    }

    @Post("posts/:postId/comments")
    createComment(@Param("postId") postId: string, @Body() body: unknown): Promise<CommentCommandResponse> {
        return this.commentCommandService.createComment(
            PositiveIntParamSchema.parse(postId),
            CreateCommentRequestSchema.parse(body)
        );
    }

    @Post("comments/:commentId/replies")
    createReply(@Param("commentId") commentId: string, @Body() body: unknown): Promise<CommentCommandResponse> {
        return this.commentCommandService.createReply(
            PositiveIntParamSchema.parse(commentId),
            CreateCommentRequestSchema.parse(body)
        );
    }

    @Patch("comments/:commentId")
    updateComment(@Param("commentId") commentId: string, @Body() body: unknown): Promise<CommentCommandResponse> {
        return this.commentCommandService.updateComment(
            PositiveIntParamSchema.parse(commentId),
            UpdateCommentRequestSchema.parse(body)
        );
    }

    @Delete("comments/:commentId")
    deleteComment(@Param("commentId") commentId: string): Promise<CommentCommandResponse> {
        return this.commentCommandService.deleteComment(PositiveIntParamSchema.parse(commentId));
    }
}
