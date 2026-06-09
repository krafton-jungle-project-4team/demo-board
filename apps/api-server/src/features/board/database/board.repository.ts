import { Injectable, type OnModuleInit } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import type { CreateCommentRequest, CreatePostRequest, UpdateCommentRequest, UpdatePostRequest } from "@nmm/shared";
import type { ActiveUser } from "../../auth/domain";
import {
    boardErrors,
    CommentEntity,
    PostEntity,
    PostTagEntity,
    PostTagLinkEntity,
    type BoardRepository
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

    async listTags(): Promise<PostTagEntity[]> {
        return (await this.tags.find()).map((tag) => this.toExistingPostTagEntity(tag));
    }

    async listPostTags(postId: number): Promise<PostTagEntity[]> {
        const links = await this.postTagLinks.findBy({ postId });

        return this.findTagsByIds(links.map((link) => Number(link.tagId)));
    }

    async listPosts(): Promise<PostEntity[]> {
        const posts = await this.posts.find();

        return posts.map((post) => this.toExistingPostEntity(post));
    }

    async findPost(id: number): Promise<PostEntity | undefined> {
        const post = await this.posts.findOneBy({ id });

        return post ? this.toExistingPostEntity(post) : undefined;
    }

    async createPost(request: CreatePostRequest, user: ActiveUser) {
        const tags = await this.resolveTags(request.tagIds);

        return this.insertPostWithTags(request, user, tags);
    }

    async savePost(post: PostEntity, request: UpdatePostRequest) {
        const tags = request.tagIds === undefined ? undefined : await this.resolveTags(request.tagIds);

        return this.savePostWithTags(
            {
                ...post,
                title: request.title ?? post.title,
                excerpt: request.excerpt ?? post.excerpt,
                content: request.content ?? post.content,
                updatedAt: new Date()
            },
            tags
        );
    }

    async listComments(postId: number): Promise<CommentEntity[]> {
        return (await this.comments.findBy({ postId })).map((comment) => this.toExistingCommentEntity(comment));
    }

    async findComment(postId: number, commentId: number): Promise<CommentEntity | undefined> {
        return this.toOptionalCommentEntity(
            await this.comments.findOneBy({
                id: commentId,
                postId
            })
        );
    }

    async createComment(postId: number, request: CreateCommentRequest, user: ActiveUser) {
        return this.toExistingCommentEntity(await this.comments.save(this.toNewCommentEntity(postId, request, user)));
    }

    async saveComment(comment: CommentEntity, request: UpdateCommentRequest) {
        return this.toExistingCommentEntity(
            await this.comments.save(
                this.toCommentEntity({
                    ...comment,
                    content: request.content ?? comment.content,
                    updatedAt: new Date()
                })
            )
        );
    }

    async deleteComment(comment: CommentEntity) {
        await this.comments.delete({ id: comment.id });
    }

    async deletePostWithComments(post: PostEntity) {
        await this.dataSource.transaction(async (manager) => {
            await manager.getRepository(CommentEntity).delete({ postId: post.id });
            await manager.getRepository(PostTagLinkEntity).delete({ postId: post.id });
            await manager.getRepository(PostEntity).delete({ id: post.id });
        });
    }

    private async findTagsByIds(ids: number[]): Promise<PostTagEntity[]> {
        if (ids.length === 0) {
            return [];
        }

        return (await this.tags.findBy({ id: In(ids) })).map((tag) => this.toExistingPostTagEntity(tag));
    }

    private async resolveTags(tagIds: number[]) {
        const uniqueTagIds = [...new Set(tagIds)];
        const tags = await this.findTagsByIds(uniqueTagIds);
        const tagById = new Map(tags.map((tag) => [tag.id, tag]));

        if (uniqueTagIds.some((tagId) => !tagById.has(tagId))) {
            throw boardErrors.unknownTags();
        }

        return uniqueTagIds.map((tagId) => tagById.get(tagId) as PostTagEntity);
    }

    private toExistingPostEntity(post: PostEntity): PostEntity {
        return {
            id: Number(post.id),
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            authorId: post.authorId,
            authorName: post.authorName,
            createdAt: new Date(post.createdAt),
            updatedAt: new Date(post.updatedAt)
        };
    }

    private toPostEntity(post: PostEntity): PostEntity {
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
        user: Pick<ActiveUser, "id" | "name">,
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

    private toExistingPostTagEntity(tag: PostTagEntity): PostTagEntity {
        return {
            id: Number(tag.id),
            name: tag.name
        };
    }

    private toOptionalCommentEntity(comment: CommentEntity | null) {
        if (!comment) {
            return undefined;
        }

        return this.toExistingCommentEntity(comment);
    }

    private toExistingCommentEntity(comment: CommentEntity): CommentEntity {
        return {
            id: Number(comment.id),
            postId: Number(comment.postId),
            content: comment.content,
            authorId: comment.authorId,
            authorName: comment.authorName,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt)
        };
    }

    private toCommentEntity(comment: CommentEntity): CommentEntity {
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
        user: Pick<ActiveUser, "id" | "name">
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
        user: Pick<ActiveUser, "id" | "name">,
        tags: PostTagEntity[],
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

            return this.toExistingPostEntity(savedPost);
        });
    }

    private async savePostWithTags(post: PostEntity, tags?: PostTagEntity[]) {
        return this.dataSource.transaction(async (manager) => {
            const postTagLinks = manager.getRepository(PostTagLinkEntity);

            const savedPost = await manager.getRepository(PostEntity).save(this.toPostEntity(post));

            if (tags !== undefined) {
                await postTagLinks.delete({ postId: post.id });

                if (tags.length > 0) {
                    await postTagLinks.save(tags.map((tag) => ({ postId: post.id, tagId: tag.id })));
                }
            }

            return this.toExistingPostEntity(savedPost);
        });
    }

    private async seedTags() {
        const existingTags = await this.listTags();

        if (existingTags.length > 0) {
            return existingTags;
        }

        return (await this.tags.save([{ name: "react" }, { name: "nest" }, { name: "boilerplate" }])).map((tag) =>
            this.toExistingPostTagEntity(tag)
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

        const savedPosts: PostEntity[] = [];

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

    private readTagId(tags: PostTagEntity[], name: string) {
        const tag = tags.find((tag) => tag.name === name);

        if (!tag) {
            throw new Error(`Seed tag not found: ${name}`);
        }

        return tag.id;
    }
}
