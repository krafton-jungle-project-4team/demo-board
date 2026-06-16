import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
    BoardCommentListQuerySchema,
    BoardCommentParamsSchema,
    BoardCommentWriteRequestSchema,
    BoardPostCreateRequestSchema,
    BoardPostListQuerySchema,
    BoardPostParamsSchema,
    BoardPostUpdateRequestSchema,
    type AuthUser as AuthUserPayload,
    type BoardCommentListResponse,
    type BoardCommandResponse,
    type BoardPostDetailResponse,
    type BoardPostListResponse,
    type BoardTagResponse
} from "@nmm/shared";
import { AuthGuard, AuthUser } from "../../auth";
import { BoardCommandService } from "../service/board-command.service";
import { BoardQueryService } from "../service/board-query.service";

@Controller("board")
export class BoardController {
    constructor(
        private readonly boardQueryService: BoardQueryService,
        private readonly boardCommandService: BoardCommandService
    ) {}

    @Get("posts")
    getPostList(@Query() query: unknown): Promise<BoardPostListResponse> {
        const boardPostListQuery = BoardPostListQuerySchema.parse(query);

        return this.boardQueryService.getPostList(boardPostListQuery);
    }

    @Post("posts")
    @UseGuards(AuthGuard)
    createPost(@AuthUser() authUser: AuthUserPayload, @Body() body: unknown): Promise<BoardCommandResponse> {
        const request = BoardPostCreateRequestSchema.parse(body);

        return this.boardCommandService.createPost(authUser, request);
    }

    @Get("posts/:postId")
    getPost(@Param() params: unknown): Promise<BoardPostDetailResponse> {
        const { postId } = BoardPostParamsSchema.parse(params);

        return this.boardQueryService.getPost(postId);
    }

    @Patch("posts/:postId")
    @UseGuards(AuthGuard)
    updatePost(
        @AuthUser() authUser: AuthUserPayload,
        @Param() params: unknown,
        @Body() body: unknown
    ): Promise<BoardCommandResponse> {
        const { postId } = BoardPostParamsSchema.parse(params);
        const request = BoardPostUpdateRequestSchema.parse(body);

        return this.boardCommandService.updatePost(authUser, postId, request);
    }

    @Delete("posts/:postId")
    @UseGuards(AuthGuard)
    deletePost(@AuthUser() authUser: AuthUserPayload, @Param() params: unknown): Promise<BoardCommandResponse> {
        const { postId } = BoardPostParamsSchema.parse(params);

        return this.boardCommandService.deletePost(authUser, postId);
    }

    @Get("tags")
    getTags(): Promise<BoardTagResponse[]> {
        return this.boardQueryService.getTags();
    }

    @Get("posts/:postId/comments")
    getComments(@Param() params: unknown, @Query() query: unknown): Promise<BoardCommentListResponse> {
        const { postId } = BoardPostParamsSchema.parse(params);
        const boardCommentListQuery = BoardCommentListQuerySchema.parse(query);

        return this.boardQueryService.getComments(postId, boardCommentListQuery);
    }

    @Post("posts/:postId/comments")
    @UseGuards(AuthGuard)
    createComment(
        @AuthUser() authUser: AuthUserPayload,
        @Param() params: unknown,
        @Body() body: unknown
    ): Promise<BoardCommandResponse> {
        const { postId } = BoardPostParamsSchema.parse(params);
        const request = BoardCommentWriteRequestSchema.parse(body);

        return this.boardCommandService.createComment(authUser, postId, request);
    }

    @Post("comments/:commentId/replies")
    @UseGuards(AuthGuard)
    createReply(
        @AuthUser() authUser: AuthUserPayload,
        @Param() params: unknown,
        @Body() body: unknown
    ): Promise<BoardCommandResponse> {
        const { commentId } = BoardCommentParamsSchema.parse(params);
        const request = BoardCommentWriteRequestSchema.parse(body);

        return this.boardCommandService.createReply(authUser, commentId, request);
    }

    @Patch("comments/:commentId")
    @UseGuards(AuthGuard)
    updateComment(
        @AuthUser() authUser: AuthUserPayload,
        @Param() params: unknown,
        @Body() body: unknown
    ): Promise<BoardCommandResponse> {
        const { commentId } = BoardCommentParamsSchema.parse(params);
        const request = BoardCommentWriteRequestSchema.parse(body);

        return this.boardCommandService.updateComment(authUser, commentId, request);
    }

    @Delete("comments/:commentId")
    @UseGuards(AuthGuard)
    deleteComment(@AuthUser() authUser: AuthUserPayload, @Param() params: unknown): Promise<BoardCommandResponse> {
        const { commentId } = BoardCommentParamsSchema.parse(params);

        return this.boardCommandService.deleteComment(authUser, commentId);
    }
}
