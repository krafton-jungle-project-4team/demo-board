import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { PostSort, PostView, UserRole, UserStatus } from "@nmm/shared";

export const postSortValues = ["created-desc", "created-asc", "title-asc"] as const satisfies readonly PostSort[];
export const postViewValues = ["table", "card"] as const satisfies readonly PostView[];
export const userRoleValues = ["USER", "ADMIN"] as const satisfies readonly UserRole[];
export const userStatusValues = ["PENDING", "ACTIVE", "SUSPENDED"] as const satisfies readonly UserStatus[];

export class CompleteSignUpDto {
  @ApiProperty({ type: String, example: "sijun" })
  name!: string;
}

export class UpdateCurrentUserDto {
  @ApiProperty({ type: String, example: "sijun" })
  name!: string;
}

export class UserDto {
  @ApiProperty({ type: String, example: "user-1" })
  id!: string;

  @ApiProperty({ type: String, example: "sijun@example.com" })
  email!: string;

  @ApiProperty({ type: String, nullable: true, example: "sijun" })
  name!: string | null;

  @ApiProperty({ type: String, nullable: true, example: "https://avatars.githubusercontent.com/u/1?v=4" })
  image!: string | null;

  @ApiProperty({ enum: userRoleValues, example: "USER" })
  role!: UserRole;

  @ApiProperty({ enum: userStatusValues, example: "ACTIVE" })
  status!: UserStatus;

  @ApiProperty({ type: String, example: "2026-06-09T00:00:00.000Z" })
  createdAt!: string;
}

export class ListPostsQueryDto {
  @ApiPropertyOptional({
    description: "게시글 제목/요약/본문/작성자/태그 검색어",
    example: "boilerplate"
  })
  q?: string;

  @ApiPropertyOptional({ type: String, description: "태그 ID로 필터링", example: "tag-react" })
  tagId?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  pageSize?: number;

  @ApiPropertyOptional({ enum: postSortValues, default: "created-desc" })
  sort?: PostSort;

  @ApiPropertyOptional({ enum: postViewValues, default: "table" })
  view?: PostView;
}

export class PostTagDto {
  @ApiProperty({ type: String, example: "tag-react" })
  id!: string;

  @ApiProperty({ type: String, example: "react" })
  name!: string;
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

  @ApiProperty({ type: String, example: "user-1" })
  authorId!: string;

  @ApiProperty({ type: String, example: "sijun" })
  authorName!: string;

  @ApiProperty({ type: String, example: "2026-06-09T00:00:00.000Z" })
  createdAt!: string;

  @ApiProperty({ type: String, example: "2026-06-09T00:00:00.000Z" })
  updatedAt!: string;

  @ApiProperty({ type: () => [PostTagDto] })
  tags!: PostTagDto[];
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

  @ApiPropertyOptional({ type: () => [String], default: [], example: ["tag-react"] })
  tagIds?: string[];
}

export class UpdatePostDto {
  @ApiPropertyOptional({ type: String, example: "수정된 제목" })
  title?: string;

  @ApiPropertyOptional({ type: String, example: "수정된 요약" })
  excerpt?: string;

  @ApiPropertyOptional({ type: String, example: "수정된 본문" })
  content?: string;

  @ApiPropertyOptional({ type: () => [String], example: ["tag-react"] })
  tagIds?: string[];
}

export class DeletePostResponseDto {
  @ApiProperty({ type: Boolean, example: true })
  ok!: boolean;

  @ApiProperty({ type: String, example: "post-1" })
  id!: string;
}

export class CommentDto {
  @ApiProperty({ type: String, example: "comment-1" })
  id!: string;

  @ApiProperty({ type: String, example: "post-1" })
  postId!: string;

  @ApiProperty({ type: String, example: "좋은 기준입니다." })
  content!: string;

  @ApiProperty({ type: String, example: "user-1" })
  authorId!: string;

  @ApiProperty({ type: String, example: "sijun" })
  authorName!: string;

  @ApiProperty({ type: String, example: "2026-06-09T00:00:00.000Z" })
  createdAt!: string;

  @ApiProperty({ type: String, example: "2026-06-09T00:00:00.000Z" })
  updatedAt!: string;
}

export class CommentListResponseDto {
  @ApiProperty({ type: () => [CommentDto] })
  items!: CommentDto[];
}

export class CreateCommentDto {
  @ApiProperty({ type: String, example: "좋은 기준입니다." })
  content!: string;
}

export class UpdateCommentDto {
  @ApiPropertyOptional({ type: String, example: "수정된 댓글입니다." })
  content?: string;
}

export class DeleteCommentResponseDto {
  @ApiProperty({ type: Boolean, example: true })
  ok!: boolean;

  @ApiProperty({ type: String, example: "comment-1" })
  id!: string;
}
