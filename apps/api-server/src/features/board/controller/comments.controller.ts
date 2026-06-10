import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
    CommentListResponseSchema,
    CommentSchema,
    CreateCommentRequestSchema,
    DeleteCommentResponseSchema,
    ResourceIdSchema,
    UpdateCommentRequestSchema
} from "@nmm/shared";
import { ActiveUserGuard, CurrentAuth, type AuthClaims } from "../../auth";
import { BoardCommandService } from "../service/board-command.service";
import { BoardQueryService } from "../service/board-query.service";

@Controller("posts/:postId/comments")
export class CommentsController {
    constructor(
        private readonly boardCommandService: BoardCommandService,
        private readonly boardQueryService: BoardQueryService
    ) {}

    @Get()
    async findComments(@Param("postId") postId: string) {
        const response = await this.boardQueryService.findComments(ResourceIdSchema.parse(postId));

        return CommentListResponseSchema.parse(response);
    }

    @Post()
    @UseGuards(ActiveUserGuard)
    async createComment(@Param("postId") postId: string, @Body() body: unknown, @CurrentAuth() claims: AuthClaims) {
        const comment = await this.boardCommandService.createComment(
            ResourceIdSchema.parse(postId),
            CreateCommentRequestSchema.parse(body),
            claims
        );

        return CommentSchema.parse(comment);
    }

    @Patch(":commentId")
    @UseGuards(ActiveUserGuard)
    async updateComment(
        @Param("postId") postId: string,
        @Param("commentId") commentId: string,
        @Body() body: unknown,
        @CurrentAuth() claims: AuthClaims
    ) {
        const comment = await this.boardCommandService.updateComment(
            ResourceIdSchema.parse(postId),
            ResourceIdSchema.parse(commentId),
            UpdateCommentRequestSchema.parse(body),
            claims
        );

        return CommentSchema.parse(comment);
    }

    @Delete(":commentId")
    @UseGuards(ActiveUserGuard)
    async deleteComment(
        @Param("postId") postId: string,
        @Param("commentId") commentId: string,
        @CurrentAuth() claims: AuthClaims
    ) {
        const response = await this.boardCommandService.deleteComment(
            ResourceIdSchema.parse(postId),
            ResourceIdSchema.parse(commentId),
            claims
        );

        return DeleteCommentResponseSchema.parse(response);
    }
}
