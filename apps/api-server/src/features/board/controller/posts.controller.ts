import { Body, Controller, Delete, Get, Headers, Param, Patch, Post as HttpPost, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags
} from "@nestjs/swagger";
import { AuthService } from "../../auth";
import { BoardService } from "../service/board.service";
import {
  CreatePostDto,
  DeletePostResponseDto,
  ListPostsQueryDto,
  PostDto,
  PostListResponseDto,
  UpdatePostDto
} from "./board.dto";

@ApiTags("posts")
@Controller("posts")
export class PostsController {
  constructor(
    private readonly authService: AuthService,
    private readonly boardService: BoardService
  ) {}

  @Get()
  @ApiOperation({
    summary: "게시글 목록 조회",
    description: "검색어, 태그, 페이지, 정렬, 보기 옵션을 받아 게시글 목록을 반환한다."
  })
  @ApiQuery({ name: "q", required: false, type: String })
  @ApiQuery({ name: "tagId", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number, minimum: 1 })
  @ApiQuery({
    name: "pageSize",
    required: false,
    type: Number,
    minimum: 1,
    maximum: 100
  })
  @ApiQuery({
    name: "sort",
    required: false,
    enum: ["created-desc", "created-asc", "title-asc"]
  })
  @ApiQuery({ name: "view", required: false, enum: ["table", "card"] })
  @ApiOkResponse({ type: PostListResponseDto })
  async findPosts(@Query() query: ListPostsQueryDto) {
    return this.boardService.findPosts(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "게시글 단건 조회" })
  @ApiParam({ name: "id", type: String, example: "post-1" })
  @ApiOkResponse({ type: PostDto })
  async findPost(@Param("id") id: string) {
    return this.boardService.findPost(id);
  }

  @HttpPost()
  @ApiCookieAuth("sessionCookie")
  @ApiBearerAuth("session")
  @ApiOperation({ summary: "게시글 생성" })
  @ApiBody({ type: CreatePostDto })
  @ApiCreatedResponse({ type: PostDto })
  async createPost(
    @Body() body: CreatePostDto,
    @Headers("authorization") authorization?: string,
    @Headers("cookie") cookieHeader?: string
  ) {
    return this.boardService.createPost(body, await this.authService.requireUser({ authorization, cookieHeader }));
  }

  @Patch(":id")
  @ApiCookieAuth("sessionCookie")
  @ApiBearerAuth("session")
  @ApiOperation({ summary: "게시글 수정" })
  @ApiParam({ name: "id", type: String, example: "post-1" })
  @ApiBody({ type: UpdatePostDto })
  @ApiOkResponse({ type: PostDto })
  async updatePost(
    @Param("id") id: string,
    @Body() body: UpdatePostDto,
    @Headers("authorization") authorization?: string,
    @Headers("cookie") cookieHeader?: string
  ) {
    return this.boardService.updatePost(id, body, await this.authService.requireUser({ authorization, cookieHeader }));
  }

  @Delete(":id")
  @ApiCookieAuth("sessionCookie")
  @ApiBearerAuth("session")
  @ApiOperation({ summary: "게시글 삭제" })
  @ApiParam({ name: "id", type: String, example: "post-1" })
  @ApiOkResponse({ type: DeletePostResponseDto })
  async deletePost(
    @Param("id") id: string,
    @Headers("authorization") authorization?: string,
    @Headers("cookie") cookieHeader?: string
  ) {
    return this.boardService.deletePost(id, await this.authService.requireUser({ authorization, cookieHeader }));
  }
}
