import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { PostSort, PostStatus, PostView } from "@nmm/shared";

export const postSortValues = ["created-desc", "created-asc", "title-asc"] as const satisfies readonly PostSort[];
export const postViewValues = ["table", "card"] as const satisfies readonly PostView[];
export const postStatusValues = ["draft", "published"] as const satisfies readonly PostStatus[];

export class ListPostsQueryDto {
  @ApiPropertyOptional({
    description: "게시글 제목/본문 검색어. 더미 API는 값을 받지만 결과를 바꾸지는 않는다.",
    example: "boilerplate"
  })
  q?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  pageSize?: number;

  @ApiPropertyOptional({ enum: postSortValues, default: "created-desc" })
  sort?: PostSort;

  @ApiPropertyOptional({ enum: postViewValues, default: "table" })
  view?: PostView;
}

export class PostDto {
  @ApiProperty({ type: String, example: "post-1" })
  id!: string;

  @ApiProperty({ type: String, example: "보일러플레이트 구조 결정" })
  title!: string;

  @ApiProperty({
    type: String,
    example: "라우터, 서버 상태, URL 상태를 분리한다."
  })
  excerpt!: string;

  @ApiProperty({
    type: String,
    example: "게시판 기능은 스택 검증을 위한 최소 CRUD 화면으로 둔다."
  })
  content!: string;

  @ApiProperty({ type: String, example: "sijun" })
  authorName!: string;

  @ApiProperty({ type: String, example: "2026-06-08T10:00:00.000Z" })
  createdAt!: string;

  @ApiProperty({ enum: postStatusValues, example: "published" })
  status!: PostStatus;
}

export class PostListResponseDto {
  @ApiProperty({ type: () => [PostDto] })
  items!: PostDto[];

  @ApiProperty({ type: Number, minimum: 1, example: 1 })
  page!: number;

  @ApiProperty({ type: Number, minimum: 1, example: 10 })
  pageSize!: number;

  @ApiProperty({ type: Number, minimum: 0, example: 3 })
  totalItems!: number;

  @ApiProperty({ type: Number, minimum: 1, example: 1 })
  totalPages!: number;
}

export class CreatePostDto {
  @ApiProperty({ type: String, example: "프론트 공통 스택 기록" })
  title!: string;

  @ApiProperty({ type: String, example: "TanStack Router와 Query를 연결한다." })
  excerpt!: string;

  @ApiProperty({
    type: String,
    example: "OpenAPI 기반 codegen으로 화면 개발의 출발점을 만든다."
  })
  content!: string;

  @ApiPropertyOptional({ enum: postStatusValues, default: "draft" })
  status?: PostStatus;
}

export class UpdatePostDto {
  @ApiPropertyOptional({ type: String, example: "수정된 제목" })
  title?: string;

  @ApiPropertyOptional({ type: String, example: "수정된 요약" })
  excerpt?: string;

  @ApiPropertyOptional({ type: String, example: "수정된 본문" })
  content?: string;

  @ApiPropertyOptional({ enum: postStatusValues })
  status?: PostStatus;
}

export class DeletePostResponseDto {
  @ApiProperty({ type: Boolean, example: true })
  ok!: boolean;

  @ApiProperty({ type: String, example: "post-1" })
  id!: string;
}
