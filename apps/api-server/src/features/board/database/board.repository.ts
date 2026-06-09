import { Injectable, type OnModuleInit } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import {
    CommentSchema,
    PostSchema,
    type Comment,
    type CreateCommentRequest,
    type CreatePostRequest,
    type Post,
    type PostTag,
    type UpdateCommentRequest,
    type UpdatePostRequest
} from "@nmm/shared";
import {
    boardErrors,
    CommentEntity,
    PostEntity,
    PostTagEntity,
    PostTagLinkEntity,
    type BoardRepository,
    type BoardUser
} from "../domain";

@Injectable()
export class BoardTypeOrmRepository implements BoardRepository, OnModuleInit {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        @InjectRepository(PostEntity) private readonly posts: Repository<PostEntity>,
        @InjectRepository(PostTagEntity) private readonly tags: Repository<PostTagEntity>,
        @InjectRepository(PostTagLinkEntity) private readonly postTagLinks: Repository<PostTagLinkEntity>,
        @InjectRepository(CommentEntity) private readonly comments: Repository<CommentEntity>
    ) {}

    async onModuleInit() {
        if (!this.dataSource.isInitialized || (await this.posts.count()) > 0) {
            return;
        }

        const tags = await this.seedTags();
        const posts = await this.seedPosts({
            boilerplate: this.readTagId(tags, "boilerplate"),
            nest: this.readTagId(tags, "nest"),
            react: this.readTagId(tags, "react")
        });
        const firstPost = posts[0];

        if (firstPost) {
            await this.seedComments(firstPost.id);
        }
    }

    async listTags(): Promise<PostTag[]> {
        return (await this.tags.find()).map((tag) => this.toExistingPostTag(tag));
    }

    async listPosts(): Promise<Post[]> {
        const posts = await this.posts.find();

        return Promise.all(posts.map((post) => this.toPost(post)));
    }

    async findPost(id: number): Promise<Post | undefined> {
        const post = await this.posts.findOneBy({ id });

        return post ? this.toPost(post) : undefined;
    }

    async createPost(request: CreatePostRequest, user: BoardUser) {
        const tags = await this.resolveTags(request.tagIds);

        return this.insertPostWithTags(request, user, tags);
    }

    async savePost(post: Post, request: UpdatePostRequest) {
        const tags = request.tagIds === undefined ? post.tags : await this.resolveTags(request.tagIds);

        return this.savePostWithTags(
            {
                ...post,
                title: request.title ?? post.title,
                excerpt: request.excerpt ?? post.excerpt,
                content: request.content ?? post.content,
                updatedAt: new Date().toISOString(),
                tags
            },
            tags
        );
    }

    async listComments(postId: number): Promise<Comment[]> {
        return (await this.comments.findBy({ postId })).map((comment) => this.toExistingComment(comment));
    }

    async findComment(postId: number, commentId: number): Promise<Comment | undefined> {
        return this.toComment(
            await this.comments.findOneBy({
                id: commentId,
                postId
            })
        );
    }

    async createComment(postId: number, request: CreateCommentRequest, user: BoardUser) {
        return this.toExistingComment(await this.comments.save(this.toNewCommentEntity(postId, request, user)));
    }

    async saveComment(comment: Comment, request: UpdateCommentRequest) {
        return this.toExistingComment(
            await this.comments.save(
                this.toCommentEntity({
                    ...comment,
                    content: request.content ?? comment.content,
                    updatedAt: new Date().toISOString()
                })
            )
        );
    }

    async deleteComment(comment: Comment) {
        await this.comments.delete({ id: comment.id });
    }

    async deletePostWithComments(post: Post) {
        await this.dataSource.transaction(async (manager) => {
            await manager.getRepository(CommentEntity).delete({ postId: post.id });
            await manager.getRepository(PostTagLinkEntity).delete({ postId: post.id });
            await manager.getRepository(PostEntity).delete({ id: post.id });
        });
    }

    private async findTagsByIds(ids: number[]): Promise<PostTag[]> {
        if (ids.length === 0) {
            return [];
        }

        return (await this.tags.findBy({ id: In(ids) })).map((tag) => this.toExistingPostTag(tag));
    }

    private async resolveTags(tagIds: number[]) {
        const uniqueTagIds = [...new Set(tagIds)];
        const tags = await this.findTagsByIds(uniqueTagIds);
        const tagById = new Map(tags.map((tag) => [tag.id, tag]));

        if (uniqueTagIds.some((tagId) => !tagById.has(tagId))) {
            throw boardErrors.unknownTags();
        }

        return uniqueTagIds.map((tagId) => tagById.get(tagId) as PostTag);
    }

    private async toPost(post: PostEntity): Promise<Post> {
        const links = await this.postTagLinks.findBy({ postId: post.id });
        const tags = await this.findTagsByIds(links.map((link) => Number(link.tagId)));

        return this.toPostWithTags(post, tags);
    }

    private toPostWithTags(post: PostEntity, tags: PostTag[]): Post {
        return PostSchema.parse({
            id: Number(post.id),
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            authorId: post.authorId,
            authorName: post.authorName,
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
            tags
        });
    }

    private toPostEntity(post: Post): PostEntity {
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

    private toNewPostEntity(
        request: CreatePostRequest,
        user: Pick<BoardUser, "id" | "name">,
        createdAt: string
    ): Omit<PostEntity, "id"> {
        return {
            title: request.title,
            excerpt: request.excerpt,
            content: request.content,
            authorId: user.id,
            authorName: user.name,
            createdAt: new Date(createdAt),
            updatedAt: new Date(createdAt)
        };
    }

    private toExistingPostTag(tag: PostTagEntity) {
        return {
            id: Number(tag.id),
            name: tag.name
        } satisfies PostTag;
    }

    private toComment(comment: CommentEntity | null) {
        if (!comment) {
            return undefined;
        }

        return CommentSchema.parse({
            id: Number(comment.id),
            postId: Number(comment.postId),
            content: comment.content,
            authorId: comment.authorId,
            authorName: comment.authorName,
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString()
        });
    }

    private toExistingComment(comment: CommentEntity) {
        return CommentSchema.parse({
            id: Number(comment.id),
            postId: Number(comment.postId),
            content: comment.content,
            authorId: comment.authorId,
            authorName: comment.authorName,
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString()
        });
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

    private toNewCommentEntity(
        postId: number,
        request: CreateCommentRequest,
        user: Pick<BoardUser, "id" | "name">
    ): Omit<CommentEntity, "id"> {
        const now = new Date();

        return {
            postId,
            content: request.content,
            authorId: user.id,
            authorName: user.name,
            createdAt: now,
            updatedAt: now
        };
    }

    private async insertPostWithTags(
        request: CreatePostRequest,
        user: Pick<BoardUser, "id" | "name">,
        tags: PostTag[],
        createdAt = new Date().toISOString()
    ) {
        return this.dataSource.transaction(async (manager) => {
            const postTagLinks = manager.getRepository(PostTagLinkEntity);
            const savedPost = await manager
                .getRepository(PostEntity)
                .save(this.toNewPostEntity(request, user, createdAt));
            const savedPostId = Number(savedPost.id);

            if (tags.length > 0) {
                await postTagLinks.save(tags.map((tag) => ({ postId: savedPostId, tagId: tag.id })));
            }

            return this.toPostWithTags(savedPost, tags);
        });
    }

    private async savePostWithTags(post: Post, tags: PostTag[]) {
        return this.dataSource.transaction(async (manager) => {
            const postTagLinks = manager.getRepository(PostTagLinkEntity);

            const savedPost = await manager.getRepository(PostEntity).save(this.toPostEntity(post));
            await postTagLinks.delete({ postId: post.id });

            if (tags.length > 0) {
                await postTagLinks.save(tags.map((tag) => ({ postId: post.id, tagId: tag.id })));
            }

            return this.toPostWithTags(savedPost, tags);
        });
    }

    private async seedTags() {
        const existingTags = await this.listTags();

        if (existingTags.length > 0) {
            return existingTags;
        }

        return (await this.tags.save([{ name: "react" }, { name: "nest" }, { name: "boilerplate" }])).map((tag) =>
            this.toExistingPostTag(tag)
        );
    }

    private async seedPosts(tagIds: { boilerplate: number; nest: number; react: number }) {
        const user = { id: "user-sijun", name: "sijun" };
        const posts = [
            {
                createdAt: "2026-06-09T00:00:00.000Z",
                request: {
                    title: "프론트 공통 스택 결정",
                    excerpt: "라우터, 서버 상태, URL 상태를 분리해 보일러플레이트의 기준을 잡는다.",
                    content:
                        "TanStack Router, TanStack Query, nuqs, shadcn/ui를 연결해 게시판 CRUD 화면의 개발 출발점을 만든다.",
                    tagIds: [tagIds.react, tagIds.boilerplate]
                }
            },
            {
                createdAt: "2026-06-09T00:10:00.000Z",
                request: {
                    title: "Shared contract API 연결",
                    excerpt: "shared Zod schema로 API 요청과 응답 계약을 공유한다.",
                    content: "FE는 작은 fetch 함수를 직접 작성하고, BE와 같은 schema로 응답 데이터를 검증한다.",
                    tagIds: [tagIds.nest, tagIds.boilerplate]
                }
            },
            {
                createdAt: "2026-06-09T00:20:00.000Z",
                request: {
                    title: "URL 상태 규칙",
                    excerpt: "검색어, 페이지, 정렬, 보기 방식은 공유 가능한 URL 상태로 둔다.",
                    content: "draft, token, PII, 대용량 데이터, 휘발성 UI 상태는 URL에 넣지 않는다.",
                    tagIds: [tagIds.boilerplate]
                }
            }
        ];

        const savedPosts: Post[] = [];

        for (const post of posts) {
            savedPosts.push(
                await this.insertPostWithTags(
                    post.request,
                    user,
                    await this.resolveTags(post.request.tagIds),
                    post.createdAt
                )
            );
        }

        return savedPosts;
    }

    private async seedComments(postId: number) {
        await this.comments.save({
            postId,
            content: "보일러플레이트 기준을 확인하기 위한 댓글 예시입니다.",
            authorId: "user-sijun",
            authorName: "sijun",
            createdAt: new Date("2026-06-09T00:30:00.000Z"),
            updatedAt: new Date("2026-06-09T00:30:00.000Z")
        });
    }

    private readTagId(tags: PostTag[], name: string) {
        const tag = tags.find((tag) => tag.name === name);

        if (!tag) {
            throw new Error(`Seed tag not found: ${name}`);
        }

        return tag.id;
    }
}
