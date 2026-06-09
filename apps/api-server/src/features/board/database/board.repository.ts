import { Injectable, type OnModuleInit } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import type { Comment, PostTag } from "@nmm/shared";
import {
    CommentEntity,
    PostEntity,
    PostTagEntity,
    PostTagLinkEntity,
    type BoardRepository,
    type NewCommentRecord,
    type NewPostRecord,
    type PostRecord
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

    async findTagsByIds(ids: number[]): Promise<PostTag[]> {
        if (ids.length === 0) {
            return [];
        }

        return (await this.tags.findBy({ id: In(ids) })).map((tag) => this.toExistingPostTag(tag));
    }

    async listPosts(): Promise<PostRecord[]> {
        const posts = await this.posts.find();

        return Promise.all(posts.map((post) => this.toPostRecord(post)));
    }

    async findPost(id: number): Promise<PostRecord | undefined> {
        const post = await this.posts.findOneBy({ id });

        return post ? this.toPostRecord(post) : undefined;
    }

    async createPost(post: NewPostRecord) {
        return this.insertPostWithTags(post);
    }

    async savePost(post: PostRecord) {
        await this.savePostWithTags(post);
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

    async createComment(comment: NewCommentRecord) {
        return this.toExistingComment(await this.comments.save(this.toNewCommentEntity(comment)));
    }

    async saveComment(comment: Comment) {
        await this.comments.save(this.toCommentEntity(comment));
    }

    async deleteComment(comment: Comment) {
        await this.comments.delete({ id: comment.id });
    }

    async deletePostWithComments(post: PostRecord) {
        await this.dataSource.transaction(async (manager) => {
            await manager.getRepository(CommentEntity).delete({ postId: post.id });
            await manager.getRepository(PostTagLinkEntity).delete({ postId: post.id });
            await manager.getRepository(PostEntity).delete({ id: post.id });
        });
    }

    private async toPostRecord(post: PostEntity): Promise<PostRecord> {
        const links = await this.postTagLinks.findBy({ postId: post.id });

        return this.toPostRecordWithTags(
            post,
            links.map((link) => Number(link.tagId))
        );
    }

    private toPostRecordWithTags(post: PostEntity, tagIds: number[]): PostRecord {
        return {
            id: Number(post.id),
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            authorId: post.authorId,
            authorName: post.authorName,
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
            tagIds: tagIds.map((tagId) => Number(tagId))
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

    private toNewPostEntity(post: NewPostRecord): Omit<PostEntity, "id"> {
        return {
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            authorId: post.authorId,
            authorName: post.authorName,
            createdAt: new Date(post.createdAt),
            updatedAt: new Date(post.updatedAt)
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

        return {
            id: Number(comment.id),
            postId: Number(comment.postId),
            content: comment.content,
            authorId: comment.authorId,
            authorName: comment.authorName,
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString()
        } satisfies Comment;
    }

    private toExistingComment(comment: CommentEntity) {
        return {
            id: Number(comment.id),
            postId: Number(comment.postId),
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

    private toNewCommentEntity(comment: NewCommentRecord): Omit<CommentEntity, "id"> {
        return {
            postId: comment.postId,
            content: comment.content,
            authorId: comment.authorId,
            authorName: comment.authorName,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt)
        };
    }

    private async insertPostWithTags(post: NewPostRecord) {
        return this.dataSource.transaction(async (manager) => {
            const postTagLinks = manager.getRepository(PostTagLinkEntity);
            const savedPost = await manager.getRepository(PostEntity).save(this.toNewPostEntity(post));
            const savedPostId = Number(savedPost.id);

            if (post.tagIds.length > 0) {
                await postTagLinks.save(post.tagIds.map((tagId) => ({ postId: savedPostId, tagId })));
            }

            return this.toPostRecordWithTags(savedPost, post.tagIds);
        });
    }

    private async savePostWithTags(post: PostRecord) {
        await this.dataSource.transaction(async (manager) => {
            const postTagLinks = manager.getRepository(PostTagLinkEntity);

            await manager.getRepository(PostEntity).save(this.toPostEntity(post));
            await postTagLinks.delete({ postId: post.id });

            if (post.tagIds.length === 0) {
                return;
            }

            await postTagLinks.save(post.tagIds.map((tagId) => ({ postId: post.id, tagId })));
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
        const posts: NewPostRecord[] = [
            {
                title: "프론트 공통 스택 결정",
                excerpt: "라우터, 서버 상태, URL 상태를 분리해 보일러플레이트의 기준을 잡는다.",
                content:
                    "TanStack Router, TanStack Query, nuqs, shadcn/ui를 연결해 게시판 CRUD 화면의 개발 출발점을 만든다.",
                authorId: "user-sijun",
                authorName: "sijun",
                createdAt: "2026-06-09T00:00:00.000Z",
                updatedAt: "2026-06-09T00:00:00.000Z",
                tagIds: [tagIds.react, tagIds.boilerplate]
            },
            {
                title: "Shared contract API 연결",
                excerpt: "shared Zod schema로 API 요청과 응답 계약을 공유한다.",
                content: "FE는 작은 fetch 함수를 직접 작성하고, BE와 같은 schema로 응답 데이터를 검증한다.",
                authorId: "user-sijun",
                authorName: "sijun",
                createdAt: "2026-06-09T00:10:00.000Z",
                updatedAt: "2026-06-09T00:10:00.000Z",
                tagIds: [tagIds.nest, tagIds.boilerplate]
            },
            {
                title: "URL 상태 규칙",
                excerpt: "검색어, 페이지, 정렬, 보기 방식은 공유 가능한 URL 상태로 둔다.",
                content: "draft, token, PII, 대용량 데이터, 휘발성 UI 상태는 URL에 넣지 않는다.",
                authorId: "user-sijun",
                authorName: "sijun",
                createdAt: "2026-06-09T00:20:00.000Z",
                updatedAt: "2026-06-09T00:20:00.000Z",
                tagIds: [tagIds.boilerplate]
            }
        ];

        const savedPosts: PostRecord[] = [];

        for (const post of posts) {
            savedPosts.push(await this.createPost(post));
        }

        return savedPosts;
    }

    private async seedComments(postId: number) {
        await this.createComment({
            postId,
            content: "보일러플레이트 기준을 확인하기 위한 댓글 예시입니다.",
            authorId: "user-sijun",
            authorName: "sijun",
            createdAt: "2026-06-09T00:30:00.000Z",
            updatedAt: "2026-06-09T00:30:00.000Z"
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
