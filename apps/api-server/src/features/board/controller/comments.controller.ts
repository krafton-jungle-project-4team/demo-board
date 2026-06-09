import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CreateCommentRequestSchema, ResourceIdSchema, UpdateCommentRequestSchema } from "@nmm/shared";
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
        return this.boardQueryService.findComments(ResourceIdSchema.parse(postId));
    }

    @Post()
    @UseGuards(ActiveUserGuard)
    async createComment(@Param("postId") postId: string, @Body() body: unknown, @CurrentAuth() claims: AuthClaims) {
        return this.boardCommandService.createComment(
            ResourceIdSchema.parse(postId),
            CreateCommentRequestSchema.parse(body),
            claims
        );
    }

    @Patch(":commentId")
    @UseGuards(ActiveUserGuard)
    async updateComment(
        @Param("postId") postId: string,
        @Param("commentId") commentId: string,
        @Body() body: unknown,
        @CurrentAuth() claims: AuthClaims
    ) {
        return this.boardCommandService.updateComment(
            ResourceIdSchema.parse(postId),
            ResourceIdSchema.parse(commentId),
            UpdateCommentRequestSchema.parse(body),
            claims
        );
    }

    @Delete(":commentId")
    @UseGuards(ActiveUserGuard)
    async deleteComment(
        @Param("postId") postId: string,
        @Param("commentId") commentId: string,
        @CurrentAuth() claims: AuthClaims
    ) {
        return this.boardCommandService.deleteComment(
            ResourceIdSchema.parse(postId),
            ResourceIdSchema.parse(commentId),
            claims
        );
    }
}
