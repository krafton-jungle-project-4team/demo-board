import { Injectable, type OnModuleInit } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "node:crypto";
import { DataSource, In, Repository } from "typeorm";
import type { Comment, Post, PostTag } from "@nmm/shared";
import { CommentEntity } from "./comment.entity";
import { PostEntity } from "./post.entity";
import { PostTagLinkEntity } from "./post-tag-link.entity";
import { PostTagEntity } from "./post-tag.entity";

export type PostRecord = Omit<Post, "tags"> & {
  tagIds: string[];
};

@Injectable()
export class BoardRepository implements OnModuleInit {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(PostEntity) private readonly posts: Repository<PostEntity>,
    @InjectRepository(PostTagEntity) private readonly tags: Repository<PostTagEntity>,
    @InjectRepository(PostTagLinkEntity) private readonly postTagLinks: Repository<PostTagLinkEntity>,
    @InjectRepository(CommentEntity) private readonly comments: Repository<CommentEntity>
  ) {}

  async onModuleInit() {
    if (!this.dataSource.isInitialized || (await this.posts.existsBy({ id: "post-1" }))) {
      return;
    }

    await this.seedTags();
    await this.seedPosts();
    await this.seedComments();
  }

  createPostId() {
    return `post-${randomUUID()}`;
  }

  createCommentId() {
    return `comment-${randomUUID()}`;
  }

  async listTags(): Promise<PostTag[]> {
    return (await this.tags.find()).map((tag) => this.toExistingPostTag(tag));
  }

  async findTag(id: string): Promise<PostTag | undefined> {
    return this.toPostTag(await this.tags.findOneBy({ id }));
  }

  async findTagsByIds(ids: string[]): Promise<PostTag[]> {
    if (ids.length === 0) {
      return [];
    }

    return (await this.tags.findBy({ id: In(ids) })).map((tag) => this.toExistingPostTag(tag));
  }

  async listPosts(): Promise<PostRecord[]> {
    const posts = await this.posts.find();

    return Promise.all(posts.map((post) => this.toPostRecord(post)));
  }

  async findPost(id: string): Promise<PostRecord | undefined> {
    const post = await this.posts.findOneBy({ id });

    return post ? this.toPostRecord(post) : undefined;
  }

  async createPost(post: PostRecord) {
    await this.posts.save(this.toPostEntity(post));
    await this.replacePostTagLinks(post.id, post.tagIds);
  }

  async savePost(post: PostRecord) {
    await this.posts.save(this.toPostEntity(post));
    await this.replacePostTagLinks(post.id, post.tagIds);
  }

  async deletePost(post: PostRecord) {
    await this.postTagLinks.delete({ postId: post.id });
    await this.posts.delete({ id: post.id });
  }

  async listComments(postId: string): Promise<Comment[]> {
    return (await this.comments.findBy({ postId })).map((comment) => this.toExistingComment(comment));
  }

  async findComment(postId: string, commentId: string): Promise<Comment | undefined> {
    return this.toComment(
      await this.comments.findOneBy({
        id: commentId,
        postId
      })
    );
  }

  async createComment(comment: Comment) {
    await this.comments.save(this.toCommentEntity(comment));
  }

  async saveComment(comment: Comment) {
    await this.comments.save(this.toCommentEntity(comment));
  }

  async deleteComment(comment: Comment) {
    await this.comments.delete({ id: comment.id });
  }

  async deleteCommentsByPostId(postId: string) {
    await this.comments.delete({ postId });
  }

  private async toPostRecord(post: PostEntity): Promise<PostRecord> {
    const links = await this.postTagLinks.findBy({ postId: post.id });

    return {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      authorId: post.authorId,
      authorName: post.authorName,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      tagIds: links.map((link) => link.tagId)
    };
  }

  private toPostEntity(post: PostRecord): PostEntity {
    return {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      authorId: post.authorId,
      authorName: post.authorName,
      createdAt: new Date(post.createdAt),
      updatedAt: new Date(post.updatedAt)
    };
  }

  private toPostTag(tag: PostTagEntity | null) {
    if (!tag) {
      return undefined;
    }

    return {
      id: tag.id,
      name: tag.name
    } satisfies PostTag;
  }

  private toExistingPostTag(tag: PostTagEntity) {
    return {
      id: tag.id,
      name: tag.name
    } satisfies PostTag;
  }

  private toComment(comment: CommentEntity | null) {
    if (!comment) {
      return undefined;
    }

    return {
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      authorId: comment.authorId,
      authorName: comment.authorName,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString()
    } satisfies Comment;
  }

  private toExistingComment(comment: CommentEntity) {
    return {
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      authorId: comment.authorId,
      authorName: comment.authorName,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString()
    } satisfies Comment;
  }

  private toCommentEntity(comment: Comment): CommentEntity {
    return {
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      authorId: comment.authorId,
      authorName: comment.authorName,
      createdAt: new Date(comment.createdAt),
      updatedAt: new Date(comment.updatedAt)
    };
  }

  private async replacePostTagLinks(postId: string, tagIds: string[]) {
    await this.postTagLinks.delete({ postId });

    if (tagIds.length === 0) {
      return;
    }

    await this.postTagLinks.save(tagIds.map((tagId) => ({ postId, tagId })));
  }

  private async seedTags() {
    await this.tags.save([
      { id: "tag-react", name: "react" },
      { id: "tag-nest", name: "nest" },
      { id: "tag-boilerplate", name: "boilerplate" }
    ]);
  }

  private async seedPosts() {
    const posts: PostRecord[] = [
      {
        id: "post-1",
        title: "프론트 공통 스택 결정",
        excerpt: "라우터, 서버 상태, URL 상태를 분리해 보일러플레이트의 기준을 잡는다.",
        content: "TanStack Router, TanStack Query, nuqs, shadcn/ui를 연결해 게시판 CRUD 화면의 개발 출발점을 만든다.",
        authorId: "user-sijun",
        authorName: "sijun",
        createdAt: "2026-06-09T00:00:00.000Z",
        updatedAt: "2026-06-09T00:00:00.000Z",
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
        tagIds: ["tag-boilerplate"]
      }
    ];

    for (const post of posts) {
      await this.createPost(post);
    }
  }

  private async seedComments() {
    await this.createComment({
      id: "comment-1",
      postId: "post-1",
      content: "보일러플레이트 기준을 확인하기 위한 댓글 예시입니다.",
      authorId: "user-sijun",
      authorName: "sijun",
      createdAt: "2026-06-09T00:30:00.000Z",
      updatedAt: "2026-06-09T00:30:00.000Z"
    });
  }
}
