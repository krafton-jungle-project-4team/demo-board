import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CreateCommentRequestSchema, ResourceIdSchema, UpdateCommentRequestSchema } from "@nmm/shared";
import { ActiveUserGuard, CurrentUser, type ActiveUser } from "../../auth";
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
    async createComment(@Param("postId") postId: string, @Body() body: unknown, @CurrentUser() user: ActiveUser) {
        return this.boardCommandService.createComment(
            ResourceIdSchema.parse(postId),
            CreateCommentRequestSchema.parse(body),
            user
        );
    }

    @Patch(":commentId")
    @UseGuards(ActiveUserGuard)
    async updateComment(
        @Param("postId") postId: string,
        @Param("commentId") commentId: string,
        @Body() body: unknown,
        @CurrentUser() user: ActiveUser
    ) {
        return this.boardCommandService.updateComment(
            ResourceIdSchema.parse(postId),
            ResourceIdSchema.parse(commentId),
            UpdateCommentRequestSchema.parse(body),
            user
        );
    }

    @Delete(":commentId")
    @UseGuards(ActiveUserGuard)
    async deleteComment(
        @Param("postId") postId: string,
        @Param("commentId") commentId: string,
        @CurrentUser() user: ActiveUser
    ) {
        return this.boardCommandService.deleteComment(
            ResourceIdSchema.parse(postId),
            ResourceIdSchema.parse(commentId),
            user
        );
    }
}
