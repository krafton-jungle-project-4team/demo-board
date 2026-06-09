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

  async findTags(): Promise<PostTag[]> {
    return (await this.boardRepository.listTags()).map((tag) => PostTagSchema.parse(tag));
  }

  async findPosts(query: unknown): Promise<PostListResponse> {
    const parsedQuery = ListPostsQuerySchema.parse(query);
    const filteredPosts = await this.filterPosts(await this.boardRepository.listPosts(), parsedQuery);
    const sortedPosts = this.sortPosts(filteredPosts, parsedQuery.sort);
    const totalItems = sortedPosts.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / parsedQuery.pageSize));
    const page = Math.min(parsedQuery.page, totalPages);
    const startIndex = (page - 1) * parsedQuery.pageSize;
    const items = await Promise.all(
      sortedPosts.slice(startIndex, startIndex + parsedQuery.pageSize).map((post) => this.toPost(post))
    );

    return PostListResponseSchema.parse({
      items,
      page,
      pageSize: parsedQuery.pageSize,
      totalItems,
      totalPages
    });
  }

  async findPost(id: string): Promise<Post> {
    return this.toPost(await this.findPostRecord(id));
  }

  async createPost(input: unknown, user: BoardUser): Promise<Post> {
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
      tagIds: await this.resolveTagIds(request.tagIds)
    };

    await this.boardRepository.createPost(post);

    return this.toPost(post);
  }

  async updatePost(id: string, input: unknown, user: BoardUser): Promise<Post> {
    const request = UpdatePostRequestSchema.parse(input);
    const post = await this.findPostRecord(id);

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
      post.tagIds = await this.resolveTagIds(request.tagIds);
    }

    post.updatedAt = new Date().toISOString();
    await this.boardRepository.savePost(post);

    return this.toPost(post);
  }

  async deletePost(id: string, user: BoardUser): Promise<DeletePostResponse> {
    const post = await this.findPostRecord(id);

    this.assertOwner(post, user);
    await this.boardRepository.deletePost(post);
    await this.boardRepository.deleteCommentsByPostId(id);

    return DeletePostResponseSchema.parse({ ok: true, id });
  }

  async findComments(postId: string): Promise<CommentListResponse> {
    await this.findPostRecord(postId);

    return CommentListResponseSchema.parse({
      items: await this.boardRepository.listComments(postId)
    });
  }

  async createComment(postId: string, input: unknown, user: BoardUser): Promise<Comment> {
    await this.findPostRecord(postId);

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

    await this.boardRepository.createComment(comment);

    return comment;
  }

  async updateComment(postId: string, commentId: string, input: unknown, user: BoardUser): Promise<Comment> {
    await this.findPostRecord(postId);

    const request = UpdateCommentRequestSchema.parse(input);
    const comment = await this.findCommentRecord(postId, commentId);

    this.assertOwner(comment, user);

    if (request.content !== undefined) {
      comment.content = request.content;
    }

    comment.updatedAt = new Date().toISOString();
    await this.boardRepository.saveComment(comment);

    return CommentSchema.parse(comment);
  }

  async deleteComment(postId: string, commentId: string, user: BoardUser): Promise<DeleteCommentResponse> {
    await this.findPostRecord(postId);

    const comment = await this.findCommentRecord(postId, commentId);

    this.assertOwner(comment, user);
    await this.boardRepository.deleteComment(comment);

    return DeleteCommentResponseSchema.parse({ ok: true, id: commentId });
  }

  private async filterPosts(posts: PostRecord[], query: ListPostsQuery) {
    const keyword = query.q.trim().toLowerCase();

    const postsWithTags = await Promise.all(
      posts.map(async (post) => ({
        post,
        tags: await this.getPostTags(post)
      }))
    );

    return postsWithTags
      .filter(({ post, tags }) => {
        const matchesKeyword =
          !keyword ||
          [post.title, post.excerpt, post.content, post.authorName, ...tags.map((tag) => tag.name)].some((value) =>
            value.toLowerCase().includes(keyword)
          );
        const matchesTag = !query.tagId || post.tagIds.includes(query.tagId);

        return matchesKeyword && matchesTag;
      })
      .map(({ post }) => post);
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

  private async findPostRecord(id: string) {
    const post = await this.boardRepository.findPost(id);

    if (!post) {
      throw new NotFoundException("게시글을 찾을 수 없습니다.");
    }

    return post;
  }

  private async findCommentRecord(postId: string, commentId: string) {
    const comment = await this.boardRepository.findComment(postId, commentId);

    if (!comment) {
      throw new NotFoundException("댓글을 찾을 수 없습니다.");
    }

    return comment;
  }

  private async resolveTagIds(tagIds: string[]) {
    const uniqueTagIds = [...new Set(tagIds)];
    const tags = await this.boardRepository.findTagsByIds(uniqueTagIds);
    const knownTagIds = new Set(tags.map((tag) => tag.id));
    const unknownTagIds = uniqueTagIds.filter((tagId) => !knownTagIds.has(tagId));

    if (unknownTagIds.length > 0) {
      throw new BadRequestException(`존재하지 않는 태그입니다: ${unknownTagIds.join(", ")}`);
    }

    return uniqueTagIds;
  }

  private async getPostTags(post: PostRecord) {
    return this.boardRepository.findTagsByIds(post.tagIds);
  }

  private async toPost(post: PostRecord): Promise<Post> {
    return PostSchema.parse({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      authorId: post.authorId,
      authorName: post.authorName,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      tags: await this.getPostTags(post)
    });
  }

  private assertOwner(resource: { authorId: string }, user: User) {
    if (resource.authorId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("작성자만 변경할 수 있습니다.");
    }
  }
}
