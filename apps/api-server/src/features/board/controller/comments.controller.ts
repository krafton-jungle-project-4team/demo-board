import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
    CommentListResponseSchema,
    CommentSchema,
    CreateCommentRequestSchema,
    DeleteCommentResponseSchema,
    ResourceIdSchema,
    UpdateCommentRequestSchema
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
    async findComments(@Param("postId") postId: string) {
        const response = await this.boardQueryService.findComments(ResourceIdSchema.parse(postId));

        return CommentListResponseSchema.parse(response);
    }

    @Post()
    @UseGuards(ActiveAccountGuard)
    async createComment(@Param("postId") postId: string, @Body() body: unknown, @CurrentAuth() claims: AuthClaims) {
        const parsedPostId = ResourceIdSchema.parse(postId);
        const comment = await this.boardCommandService.createComment(
            parsedPostId,
            CreateCommentRequestSchema.parse(body),
            claims
        );
        const response = await this.boardQueryService.findComment(parsedPostId, comment);

        return CommentSchema.parse(response);
    }

    @Patch(":commentId")
    @UseGuards(ActiveAccountGuard)
    async updateComment(
        @Param("postId") postId: string,
        @Param("commentId") commentId: string,
        @Body() body: unknown,
        @CurrentAuth() claims: AuthClaims
    ) {
        const parsedPostId = ResourceIdSchema.parse(postId);
        const parsedCommentId = ResourceIdSchema.parse(commentId);
        await this.boardCommandService.updateComment(
            parsedPostId,
            parsedCommentId,
            UpdateCommentRequestSchema.parse(body),
            claims
        );
        const comment = await this.boardQueryService.findComment(parsedPostId, parsedCommentId);

        return CommentSchema.parse(comment);
    }

    @Delete(":commentId")
    @UseGuards(ActiveAccountGuard)
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
