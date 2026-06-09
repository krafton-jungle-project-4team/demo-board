import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  CommentListResponseSchema,
  CommentSchema,
  CreateCommentRequestSchema,
  CreatePostRequestSchema,
  DeleteCommentResponseSchema,
  DeletePostResponseSchema,
  ListPostsQuerySchema,
  PostListResponseSchema,
  PostSchema,
  PostTagSchema,
  UpdateCommentRequestSchema,
  UpdatePostRequestSchema,
  type Comment,
  type CommentListResponse,
  type DeleteCommentResponse,
  type DeletePostResponse,
  type ListPostsQuery,
  type Post,
  type PostListResponse,
  type PostTag,
  type User
} from "@nmm/shared";

type PostRecord = Omit<Post, "tags"> & {
  tagIds: string[];
};

@Injectable()
export class BoardService {
  private nextPostNumber = 4;
  private nextCommentNumber = 2;
  private readonly tags: PostTag[] = [
    { id: "tag-react", name: "react" },
    { id: "tag-nest", name: "nest" },
    { id: "tag-boilerplate", name: "boilerplate" }
  ];
  private readonly posts: PostRecord[] = [
    {
      id: "post-1",
      title: "프론트 공통 스택 결정",
      excerpt: "라우터, 서버 상태, URL 상태를 분리해 보일러플레이트의 기준을 잡는다.",
      content: "TanStack Router, TanStack Query, nuqs, shadcn/ui를 연결해 게시판 CRUD 화면의 개발 출발점을 만든다.",
      authorId: "user-sijun",
      authorName: "sijun",
      createdAt: "2026-06-09T00:00:00.000Z",
      updatedAt: "2026-06-09T00:00:00.000Z",
      status: "published",
      tagIds: ["tag-react", "tag-boilerplate"]
    },
    {
      id: "post-2",
      title: "OpenAPI codegen 연결",
      excerpt: "Nest 더미 API에서 spec을 만들고 Orval로 fetch 함수를 생성한다.",
      content: "OpenAPI spec을 생성해 frontend가 API 타입과 호출 함수를 반복 작성하지 않게 한다.",
      authorId: "user-sijun",
      authorName: "sijun",
      createdAt: "2026-06-09T00:10:00.000Z",
      updatedAt: "2026-06-09T00:10:00.000Z",
      status: "published",
      tagIds: ["tag-nest", "tag-boilerplate"]
    },
    {
      id: "post-3",
      title: "URL 상태 규칙",
      excerpt: "검색어, 페이지, 정렬, 보기 방식은 공유 가능한 URL 상태로 둔다.",
      content: "draft, token, PII, 대용량 데이터, 휘발성 UI 상태는 URL에 넣지 않는다.",
      authorId: "user-sijun",
      authorName: "sijun",
      createdAt: "2026-06-09T00:20:00.000Z",
      updatedAt: "2026-06-09T00:20:00.000Z",
      status: "draft",
      tagIds: ["tag-boilerplate"]
    }
  ];
  private readonly comments: Comment[] = [
    {
      id: "comment-1",
      postId: "post-1",
      content: "보일러플레이트 기준을 확인하기 위한 댓글 예시입니다.",
      authorId: "user-sijun",
      authorName: "sijun",
      createdAt: "2026-06-09T00:30:00.000Z",
      updatedAt: "2026-06-09T00:30:00.000Z"
    }
  ];

  findTags(): PostTag[] {
    return this.tags.map((tag) => PostTagSchema.parse(tag));
  }

  findPosts(query: unknown): PostListResponse {
    const parsedQuery = ListPostsQuerySchema.parse(query);
    const filteredPosts = this.filterPosts(parsedQuery);
    const sortedPosts = this.sortPosts(filteredPosts, parsedQuery.sort);
    const totalItems = sortedPosts.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / parsedQuery.pageSize));
    const page = Math.min(parsedQuery.page, totalPages);
    const startIndex = (page - 1) * parsedQuery.pageSize;
    const items = sortedPosts.slice(startIndex, startIndex + parsedQuery.pageSize).map((post) => this.toPost(post));

    return PostListResponseSchema.parse({
      items,
      page,
      pageSize: parsedQuery.pageSize,
      totalItems,
      totalPages
    });
  }

  findPost(id: string): Post {
    return this.toPost(this.findPostRecord(id));
  }

  createPost(input: unknown, user: User): Post {
    const request = CreatePostRequestSchema.parse(input);
    const now = new Date().toISOString();
    const post: PostRecord = {
      id: `post-${this.nextPostNumber++}`,
      title: request.title,
      excerpt: request.excerpt,
      content: request.content,
      authorId: user.id,
      authorName: user.name,
      createdAt: now,
      updatedAt: now,
      status: request.status,
      tagIds: this.resolveTagIds(request.tagIds)
    };

    this.posts.unshift(post);

    return this.toPost(post);
  }

  updatePost(id: string, input: unknown, user: User): Post {
    const request = UpdatePostRequestSchema.parse(input);
    const post = this.findPostRecord(id);

    this.assertOwner(post, user);

    if (request.title !== undefined) {
      post.title = request.title;
    }

    if (request.excerpt !== undefined) {
      post.excerpt = request.excerpt;
    }

    if (request.content !== undefined) {
      post.content = request.content;
    }

    if (request.status !== undefined) {
      post.status = request.status;
    }

    if (request.tagIds !== undefined) {
      post.tagIds = this.resolveTagIds(request.tagIds);
    }

    post.updatedAt = new Date().toISOString();

    return this.toPost(post);
  }

  deletePost(id: string, user: User): DeletePostResponse {
    const post = this.findPostRecord(id);

    this.assertOwner(post, user);
    this.posts.splice(this.posts.indexOf(post), 1);

    for (let index = this.comments.length - 1; index >= 0; index -= 1) {
      if (this.comments[index]?.postId === id) {
        this.comments.splice(index, 1);
      }
    }

    return DeletePostResponseSchema.parse({ ok: true, id });
  }

  findComments(postId: string): CommentListResponse {
    this.findPostRecord(postId);

    return CommentListResponseSchema.parse({
      items: this.comments.filter((comment) => comment.postId === postId)
    });
  }

  createComment(postId: string, input: unknown, user: User): Comment {
    this.findPostRecord(postId);

    const request = CreateCommentRequestSchema.parse(input);
    const now = new Date().toISOString();
    const comment = CommentSchema.parse({
      id: `comment-${this.nextCommentNumber++}`,
      postId,
      content: request.content,
      authorId: user.id,
      authorName: user.name,
      createdAt: now,
      updatedAt: now
    });

    this.comments.push(comment);

    return comment;
  }

  updateComment(postId: string, commentId: string, input: unknown, user: User): Comment {
    this.findPostRecord(postId);

    const request = UpdateCommentRequestSchema.parse(input);
    const comment = this.findCommentRecord(postId, commentId);

    this.assertOwner(comment, user);

    if (request.content !== undefined) {
      comment.content = request.content;
    }

    comment.updatedAt = new Date().toISOString();

    return CommentSchema.parse(comment);
  }

  deleteComment(postId: string, commentId: string, user: User): DeleteCommentResponse {
    this.findPostRecord(postId);

    const comment = this.findCommentRecord(postId, commentId);

    this.assertOwner(comment, user);
    this.comments.splice(this.comments.indexOf(comment), 1);

    return DeleteCommentResponseSchema.parse({ ok: true, id: commentId });
  }

  private filterPosts(query: ListPostsQuery) {
    const keyword = query.q.trim().toLowerCase();

    return this.posts.filter((post) => {
      const tags = this.getPostTags(post);
      const matchesKeyword =
        !keyword ||
        [post.title, post.excerpt, post.content, post.authorName, ...tags.map((tag) => tag.name)].some((value) =>
          value.toLowerCase().includes(keyword)
        );
      const matchesTag = !query.tagId || post.tagIds.includes(query.tagId);

      return matchesKeyword && matchesTag;
    });
  }

  private sortPosts(posts: PostRecord[], sort: ListPostsQuery["sort"]) {
    return [...posts].sort((left, right) => {
      if (sort === "created-asc") {
        return left.createdAt.localeCompare(right.createdAt);
      }

      if (sort === "title-asc") {
        return left.title.localeCompare(right.title);
      }

      return right.createdAt.localeCompare(left.createdAt);
    });
  }

  private findPostRecord(id: string) {
    const post = this.posts.find((item) => item.id === id);

    if (!post) {
      throw new NotFoundException("게시글을 찾을 수 없습니다.");
    }

    return post;
  }

  private findCommentRecord(postId: string, commentId: string) {
    const comment = this.comments.find((item) => item.postId === postId && item.id === commentId);

    if (!comment) {
      throw new NotFoundException("댓글을 찾을 수 없습니다.");
    }

    return comment;
  }

  private resolveTagIds(tagIds: string[]) {
    const uniqueTagIds = [...new Set(tagIds)];
    const unknownTagIds = uniqueTagIds.filter((tagId) => !this.tags.some((tag) => tag.id === tagId));

    if (unknownTagIds.length > 0) {
      throw new BadRequestException(`존재하지 않는 태그입니다: ${unknownTagIds.join(", ")}`);
    }

    return uniqueTagIds;
  }

  private getPostTags(post: PostRecord) {
    return post.tagIds.map((tagId) => this.tags.find((tag) => tag.id === tagId)).filter((tag) => tag !== undefined);
  }

  private toPost(post: PostRecord): Post {
    return PostSchema.parse({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      authorId: post.authorId,
      authorName: post.authorName,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      status: post.status,
      tags: this.getPostTags(post)
    });
  }

  private assertOwner(resource: { authorId: string }, user: User) {
    if (resource.authorId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("작성자만 변경할 수 있습니다.");
    }
  }
}
