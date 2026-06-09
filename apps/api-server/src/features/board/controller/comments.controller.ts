import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { AuthQueryService } from "../../auth";
import { BoardCommandService } from "../service/board-command.service";
import { BoardQueryService } from "../service/board-query.service";

@Controller("posts/:postId/comments")
export class CommentsController {
    constructor(
        private readonly authQueryService: AuthQueryService,
        private readonly boardCommandService: BoardCommandService,
        private readonly boardQueryService: BoardQueryService
    ) {}

    @Get()
    async findComments(@Param("postId") postId: string) {
        return this.boardQueryService.findComments(postId);
    }

    @Post()
    async createComment(
        @Param("postId") postId: string,
        @Body() body: unknown,
        @Headers("authorization") authorization?: string,
        @Headers("cookie") cookieHeader?: string
    ) {
        return this.boardCommandService.createComment(
            postId,
            body,
            await this.authQueryService.requireUser({ authorization, cookieHeader })
        );
    }

    @Patch(":commentId")
    async updateComment(
        @Param("postId") postId: string,
        @Param("commentId") commentId: string,
        @Body() body: unknown,
        @Headers("authorization") authorization?: string,
        @Headers("cookie") cookieHeader?: string
    ) {
        return this.boardCommandService.updateComment(
            postId,
            commentId,
            body,
            await this.authQueryService.requireUser({ authorization, cookieHeader })
        );
    }

    @Delete(":commentId")
    async deleteComment(
        @Param("postId") postId: string,
        @Param("commentId") commentId: string,
        @Headers("authorization") authorization?: string,
        @Headers("cookie") cookieHeader?: string
    ) {
        return this.boardCommandService.deleteComment(
            postId,
            commentId,
            await this.authQueryService.requireUser({ authorization, cookieHeader })
        );
    }
}
