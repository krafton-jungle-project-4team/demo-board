import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiBody,
    ApiCookieAuth,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags
} from "@nestjs/swagger";
import { ApiStandardErrorResponses } from "../../../common/http";
import { AuthQueryService } from "../../auth";
import { BoardCommandService } from "../service/board-command.service";
import { BoardQueryService } from "../service/board-query.service";
import {
    commentApiResponseOpenApiSchema,
    commentListApiResponseOpenApiSchema,
    createCommentRequestOpenApiSchema,
    deleteCommentApiResponseOpenApiSchema,
    updateCommentRequestOpenApiSchema
} from "./board.openapi";

@ApiTags("comments")
@ApiStandardErrorResponses()
@Controller("posts/:postId/comments")
export class CommentsController {
    constructor(
        private readonly authQueryService: AuthQueryService,
        private readonly boardCommandService: BoardCommandService,
        private readonly boardQueryService: BoardQueryService
    ) {}

    @Get()
    @ApiOperation({ summary: "댓글 목록 조회" })
    @ApiParam({ name: "postId", type: String, example: "post-1" })
    @ApiOkResponse({ schema: commentListApiResponseOpenApiSchema })
    async findComments(@Param("postId") postId: string) {
        return this.boardQueryService.findComments(postId);
    }

    @Post()
    @ApiCookieAuth("sessionCookie")
    @ApiBearerAuth("session")
    @ApiOperation({ summary: "댓글 작성" })
    @ApiParam({ name: "postId", type: String, example: "post-1" })
    @ApiBody({ schema: createCommentRequestOpenApiSchema })
    @ApiCreatedResponse({ schema: commentApiResponseOpenApiSchema })
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
    @ApiCookieAuth("sessionCookie")
    @ApiBearerAuth("session")
    @ApiOperation({ summary: "댓글 수정" })
    @ApiParam({ name: "postId", type: String, example: "post-1" })
    @ApiParam({ name: "commentId", type: String, example: "comment-1" })
    @ApiBody({ schema: updateCommentRequestOpenApiSchema })
    @ApiOkResponse({ schema: commentApiResponseOpenApiSchema })
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
    @ApiCookieAuth("sessionCookie")
    @ApiBearerAuth("session")
    @ApiOperation({ summary: "댓글 삭제" })
    @ApiParam({ name: "postId", type: String, example: "post-1" })
    @ApiParam({ name: "commentId", type: String, example: "comment-1" })
    @ApiOkResponse({ schema: deleteCommentApiResponseOpenApiSchema })
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
