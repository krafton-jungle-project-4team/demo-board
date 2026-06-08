import { Body, Controller, Delete, Get, Param, Patch, Post as HttpPost, Query } from "@nestjs/common";
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import {
  CreatePostRequestSchema,
  DeletePostResponseSchema,
  ListPostsQuerySchema,
  PostListResponseSchema,
  PostSchema,
  UpdatePostRequestSchema,
  type DeletePostResponse,
  type Post,
  type PostListResponse
} from "@nmm/shared";
import {
  CreatePostDto,
  DeletePostResponseDto,
  ListPostsQueryDto,
  PostDto,
  PostListResponseDto,
  UpdatePostDto
} from "./posts.dto";

const dummyPosts: Post[] = [
  {
    id: "post-1",
    title: "프론트 공통 스택 결정",
    excerpt: "라우터, 서버 상태, URL 상태를 분리해 보일러플레이트의 기준을 잡는다.",
    content: "TanStack Router, TanStack Query, nuqs, shadcn/ui를 연결해 게시판 CRUD 화면의 개발 출발점을 만든다.",
    authorName: "sijun",
    createdAt: "2026-06-08T10:00:00.000Z",
    status: "published"
  },
  {
    id: "post-2",
    title: "OpenAPI codegen 연결",
    excerpt: "Nest 더미 API에서 spec을 만들고 Orval로 query hook을 생성한다.",
    content: "fetch wrapper는 baseURL, auth header, error 처리만 담당하도록 작게 유지한다.",
    authorName: "sijun",
    createdAt: "2026-06-08T10:10:00.000Z",
    status: "published"
  },
  {
    id: "post-3",
    title: "URL 상태 규칙",
    excerpt: "검색어, 페이지, 정렬, 보기 방식은 공유 가능한 URL 상태로 둔다.",
    content: "draft, token, PII, 대용량 데이터, 휘발성 UI 상태는 URL에 넣지 않는다.",
    authorName: "sijun",
    createdAt: "2026-06-08T10:20:00.000Z",
    status: "draft"
  }
];

@ApiTags("posts")
@Controller("posts")
export class PostsController {
  @Get()
  @ApiOperation({
    summary: "게시글 목록 조회",
    description: "검색/페이지/정렬/보기 옵션을 받지만 더미 API라 결과는 고정 목록을 반환한다."
  })
  @ApiQuery({ name: "q", required: false, type: String })
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
  findPosts(@Query() query: ListPostsQueryDto): PostListResponse {
    const parsedQuery = ListPostsQuerySchema.parse(query);
    const response = {
      items: dummyPosts,
      page: parsedQuery.page,
      pageSize: parsedQuery.pageSize,
      totalItems: dummyPosts.length,
      totalPages: Math.max(1, Math.ceil(dummyPosts.length / parsedQuery.pageSize))
    };

    return PostListResponseSchema.parse(response);
  }

  @Get(":id")
  @ApiOperation({ summary: "게시글 단건 조회" })
  @ApiParam({ name: "id", type: String, example: "post-1" })
  @ApiOkResponse({ type: PostDto })
  findPost(@Param("id") id: string): Post {
    const post = dummyPosts.find((item) => item.id === id) ?? dummyPosts[0];

    return PostSchema.parse(post);
  }

  @HttpPost()
  @ApiOperation({ summary: "게시글 생성 더미 응답" })
  @ApiBody({ type: CreatePostDto })
  @ApiCreatedResponse({ type: PostDto })
  createPost(@Body() body: CreatePostDto): Post {
    const dto = CreatePostRequestSchema.parse(body);

    return PostSchema.parse({
      id: "post-created",
      title: dto.title,
      excerpt: dto.excerpt,
      content: dto.content,
      authorName: "sijun",
      createdAt: "2026-06-08T10:30:00.000Z",
      status: dto.status
    });
  }

  @Patch(":id")
  @ApiOperation({ summary: "게시글 수정 더미 응답" })
  @ApiParam({ name: "id", type: String, example: "post-1" })
  @ApiBody({ type: UpdatePostDto })
  @ApiOkResponse({ type: PostDto })
  updatePost(@Param("id") id: string, @Body() body: UpdatePostDto): Post {
    const dto = UpdatePostRequestSchema.parse(body);
    const basePost = dummyPosts.find((item) => item.id === id) ?? dummyPosts[0];

    return PostSchema.parse({
      ...basePost,
      ...dto,
      id
    });
  }

  @Delete(":id")
  @ApiOperation({ summary: "게시글 삭제 더미 응답" })
  @ApiParam({ name: "id", type: String, example: "post-1" })
  @ApiOkResponse({ type: DeletePostResponseDto })
  deletePost(@Param("id") id: string): DeletePostResponse {
    return DeletePostResponseSchema.parse({
      ok: true,
      id
    });
  }
}
