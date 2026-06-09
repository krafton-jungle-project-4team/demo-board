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
import { AuthService } from "../../auth";
import { BoardService } from "../service/board.service";
import {
  CommentDto,
  CommentListResponseDto,
  CreateCommentDto,
  DeleteCommentResponseDto,
  UpdateCommentDto
} from "./board.dto";

@ApiTags("comments")
@Controller("posts/:postId/comments")
export class CommentsController {
  constructor(
    private readonly authService: AuthService,
    private readonly boardService: BoardService
  ) {}

  @Get()
  @ApiOperation({ summary: "댓글 목록 조회" })
  @ApiParam({ name: "postId", type: String, example: "post-1" })
  @ApiOkResponse({ type: CommentListResponseDto })
  async findComments(@Param("postId") postId: string) {
    return this.boardService.findComments(postId);
  }

  @Post()
  @ApiCookieAuth("sessionCookie")
  @ApiBearerAuth("session")
  @ApiOperation({ summary: "댓글 작성" })
  @ApiParam({ name: "postId", type: String, example: "post-1" })
  @ApiBody({ type: CreateCommentDto })
  @ApiCreatedResponse({ type: CommentDto })
  async createComment(
    @Param("postId") postId: string,
    @Body() body: CreateCommentDto,
    @Headers("authorization") authorization?: string,
    @Headers("cookie") cookieHeader?: string
  ) {
    return this.boardService.createComment(
      postId,
      body,
      await this.authService.requireUser({ authorization, cookieHeader })
    );
  }

  @Patch(":commentId")
  @ApiCookieAuth("sessionCookie")
  @ApiBearerAuth("session")
  @ApiOperation({ summary: "댓글 수정" })
  @ApiParam({ name: "postId", type: String, example: "post-1" })
  @ApiParam({ name: "commentId", type: String, example: "comment-1" })
  @ApiBody({ type: UpdateCommentDto })
  @ApiOkResponse({ type: CommentDto })
  async updateComment(
    @Param("postId") postId: string,
    @Param("commentId") commentId: string,
    @Body() body: UpdateCommentDto,
    @Headers("authorization") authorization?: string,
    @Headers("cookie") cookieHeader?: string
  ) {
    return this.boardService.updateComment(
      postId,
      commentId,
      body,
      await this.authService.requireUser({ authorization, cookieHeader })
    );
  }

  @Delete(":commentId")
  @ApiCookieAuth("sessionCookie")
  @ApiBearerAuth("session")
  @ApiOperation({ summary: "댓글 삭제" })
  @ApiParam({ name: "postId", type: String, example: "post-1" })
  @ApiParam({ name: "commentId", type: String, example: "comment-1" })
  @ApiOkResponse({ type: DeleteCommentResponseDto })
  async deleteComment(
    @Param("postId") postId: string,
    @Param("commentId") commentId: string,
    @Headers("authorization") authorization?: string,
    @Headers("cookie") cookieHeader?: string
  ) {
    return this.boardService.deleteComment(
      postId,
      commentId,
      await this.authService.requireUser({ authorization, cookieHeader })
    );
  }
}
