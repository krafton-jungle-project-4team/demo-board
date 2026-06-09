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
import { BoardRepository, type PostRecord } from "../database/board.repository";

type BoardUser = User & {
  name: string;
};

@Injectable()
export class BoardService {
  constructor(private readonly boardRepository: BoardRepository) {}

  findTags(): PostTag[] {
    return this.boardRepository.listTags().map((tag) => PostTagSchema.parse(tag));
  }

  findPosts(query: unknown): PostListResponse {
    const parsedQuery = ListPostsQuerySchema.parse(query);
    const filteredPosts = this.filterPosts(this.boardRepository.listPosts(), parsedQuery);
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

  createPost(input: unknown, user: BoardUser): Post {
    const request = CreatePostRequestSchema.parse(input);
    const now = new Date().toISOString();
    const post: PostRecord = {
      id: this.boardRepository.createPostId(),
      title: request.title,
      excerpt: request.excerpt,
      content: request.content,
      authorId: user.id,
      authorName: user.name,
      createdAt: now,
      updatedAt: now,
      tagIds: this.resolveTagIds(request.tagIds)
    };

    this.boardRepository.createPost(post);

    return this.toPost(post);
  }

  updatePost(id: string, input: unknown, user: BoardUser): Post {
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

    if (request.tagIds !== undefined) {
      post.tagIds = this.resolveTagIds(request.tagIds);
    }

    post.updatedAt = new Date().toISOString();

    return this.toPost(post);
  }

  deletePost(id: string, user: BoardUser): DeletePostResponse {
    const post = this.findPostRecord(id);

    this.assertOwner(post, user);
    this.boardRepository.deletePost(post);
    this.boardRepository.deleteCommentsByPostId(id);

    return DeletePostResponseSchema.parse({ ok: true, id });
  }

  findComments(postId: string): CommentListResponse {
    this.findPostRecord(postId);

    return CommentListResponseSchema.parse({
      items: this.boardRepository.listComments(postId)
    });
  }

  createComment(postId: string, input: unknown, user: BoardUser): Comment {
    this.findPostRecord(postId);

    const request = CreateCommentRequestSchema.parse(input);
    const now = new Date().toISOString();
    const comment = CommentSchema.parse({
      id: this.boardRepository.createCommentId(),
      postId,
      content: request.content,
      authorId: user.id,
      authorName: user.name,
      createdAt: now,
      updatedAt: now
    });

    this.boardRepository.createComment(comment);

    return comment;
  }

  updateComment(postId: string, commentId: string, input: unknown, user: BoardUser): Comment {
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

  deleteComment(postId: string, commentId: string, user: BoardUser): DeleteCommentResponse {
    this.findPostRecord(postId);

    const comment = this.findCommentRecord(postId, commentId);

    this.assertOwner(comment, user);
    this.boardRepository.deleteComment(comment);

    return DeleteCommentResponseSchema.parse({ ok: true, id: commentId });
  }

  private filterPosts(posts: PostRecord[], query: ListPostsQuery) {
    const keyword = query.q.trim().toLowerCase();

    return posts.filter((post) => {
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
    const post = this.boardRepository.findPost(id);

    if (!post) {
      throw new NotFoundException("게시글을 찾을 수 없습니다.");
    }

    return post;
  }

  private findCommentRecord(postId: string, commentId: string) {
    const comment = this.boardRepository.findComment(postId, commentId);

    if (!comment) {
      throw new NotFoundException("댓글을 찾을 수 없습니다.");
    }

    return comment;
  }

  private resolveTagIds(tagIds: string[]) {
    const uniqueTagIds = [...new Set(tagIds)];
    const unknownTagIds = uniqueTagIds.filter((tagId) => !this.boardRepository.findTag(tagId));

    if (unknownTagIds.length > 0) {
      throw new BadRequestException(`존재하지 않는 태그입니다: ${unknownTagIds.join(", ")}`);
    }

    return uniqueTagIds;
  }

  private getPostTags(post: PostRecord) {
    return post.tagIds.map((tagId) => this.boardRepository.findTag(tagId)).filter((tag) => tag !== undefined);
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
      tags: this.getPostTags(post)
    });
  }

  private assertOwner(resource: { authorId: string }, user: User) {
    if (resource.authorId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("작성자만 변경할 수 있습니다.");
    }
  }
}
