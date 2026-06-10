import { Injectable, type OnModuleInit } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import {
    type Comment,
    type CreateCommentRequest,
    type CreatePostRequest,
    type DeleteCommentResponse,
    type DeletePostResponse,
    type Post,
    type UpdateCommentRequest,
    type UpdatePostRequest
} from "@nmm/shared";
import { DataSource, Repository } from "typeorm";
import { appErrors } from "../../../app-errors";
import { AuthQueryService, type AuthClaims, type CompletedUserRecord } from "../../auth";
import { CommentEntity, PostEntity, PostTagEntity, PostTagLinkEntity } from "../database";
import { BoardQueryService } from "./board-query.service";

@Injectable()
export class BoardCommandService implements OnModuleInit {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        @InjectRepository(PostEntity) private readonly posts: Repository<PostEntity>,
        @InjectRepository(PostTagEntity) private readonly tags: Repository<PostTagEntity>,
        @InjectRepository(CommentEntity) private readonly comments: Repository<CommentEntity>,
        private readonly boardQueryService: BoardQueryService,
        private readonly authQueryService: AuthQueryService
    ) {}

    async onModuleInit() {
        if (!this.dataSource.isInitialized || (await this.posts.count()) > 0) {
            return;
        }

        const tags = await this.seedTags();
        const postIds = await this.seedPosts({
            boilerplate: this.readTagId(tags, "boilerplate"),
            nest: this.readTagId(tags, "nest"),
            react: this.readTagId(tags, "react")
        });
        const firstPostId = postIds[0];

        if (firstPostId) {
            await this.seedComments(firstPostId);
        }
    }

    async createPost(request: CreatePostRequest, claims: AuthClaims): Promise<Post> {
        const user = await this.authQueryService.requireCompletedUserRecord(claims);
        const tags = await this.boardQueryService.resolveTags(request.tagIds);

        return this.boardQueryService.findPost(await this.insertPostWithTags(request, user, tags));
    }

    async updatePost(id: number, request: UpdatePostRequest, claims: AuthClaims): Promise<Post> {
        const post = await this.boardQueryService.findExistingPost(id);

        this.assertOwner(post, claims);
        const tags =
            request.tagIds === undefined ? undefined : await this.boardQueryService.resolveTags(request.tagIds);

        post.title = request.title ?? post.title;
        post.excerpt = request.excerpt ?? post.excerpt;
        post.content = request.content ?? post.content;
        post.updatedAt = new Date();
        await this.savePostWithTags(post, tags);

        return this.boardQueryService.findPost(id);
    }

    async deletePost(id: number, claims: AuthClaims): Promise<DeletePostResponse> {
        const post = await this.boardQueryService.findExistingPost(id);

        this.assertOwner(post, claims);
        await this.deletePostWithComments(post);

        return { ok: true, id };
    }

    async createComment(postId: number, request: CreateCommentRequest, claims: AuthClaims): Promise<Comment> {
        await this.boardQueryService.findExistingPost(postId);
        const user = await this.authQueryService.requireCompletedUserRecord(claims);
        const now = new Date();
        const savedComment = await this.comments.save(
            this.comments.create({
                postId,
                content: request.content,
                authorId: user.id,
                authorName: user.name,
                createdAt: now,
                updatedAt: now
            })
        );

        return (await this.boardQueryService.findExistingComment(postId, Number(savedComment.id))).toComment();
    }

    async updateComment(
        postId: number,
        commentId: number,
        request: UpdateCommentRequest,
        claims: AuthClaims
    ): Promise<Comment> {
        await this.boardQueryService.findExistingPost(postId);

        const comment = await this.boardQueryService.findExistingComment(postId, commentId);

        this.assertOwner(comment, claims);

        comment.content = request.content ?? comment.content;
        comment.updatedAt = new Date();
        await this.comments.save(comment);

        return (await this.boardQueryService.findExistingComment(postId, commentId)).toComment();
    }

    async deleteComment(postId: number, commentId: number, claims: AuthClaims): Promise<DeleteCommentResponse> {
        await this.boardQueryService.findExistingPost(postId);

        const comment = await this.boardQueryService.findExistingComment(postId, commentId);

        this.assertOwner(comment, claims);
        await this.comments.delete({ id: comment.id });

        return { ok: true, id: commentId };
    }

    private assertOwner(resource: { authorId: string }, claims: Pick<AuthClaims, "role" | "userId">) {
        if (resource.authorId !== claims.userId && claims.role !== "ADMIN") {
            throw appErrors.boardNotResourceOwner();
        }
    }

    private async insertPostWithTags(
        request: CreatePostRequest,
        user: Pick<CompletedUserRecord, "id" | "name">,
        tags: PostTagEntity[],
        createdAt = new Date().toISOString()
    ): Promise<number> {
        return this.dataSource.transaction(async (manager) => {
            const postTagLinks = manager.getRepository(PostTagLinkEntity);
            const savedPost = await manager.getRepository(PostEntity).save(
                manager.getRepository(PostEntity).create({
                    title: request.title,
                    excerpt: request.excerpt,
                    content: request.content,
                    authorId: user.id,
                    authorName: user.name,
                    createdAt: new Date(createdAt),
                    updatedAt: new Date(createdAt)
                })
            );
            const savedPostId = Number(savedPost.id);

            if (tags.length > 0) {
                await postTagLinks.save(tags.map((tag) => ({ postId: savedPostId, tagId: tag.id })));
            }

            return savedPostId;
        });
    }

    private async savePostWithTags(post: PostEntity, tags?: PostTagEntity[]) {
        await this.dataSource.transaction(async (manager) => {
            const postTagLinks = manager.getRepository(PostTagLinkEntity);

            await manager.getRepository(PostEntity).save(post);

            if (tags !== undefined) {
                await postTagLinks.delete({ postId: post.id });

                if (tags.length > 0) {
                    await postTagLinks.save(tags.map((tag) => ({ postId: post.id, tagId: tag.id })));
                }
            }
        });
    }

    private async deletePostWithComments(post: PostEntity) {
        await this.dataSource.transaction(async (manager) => {
            await manager.getRepository(CommentEntity).delete({ postId: post.id });
            await manager.getRepository(PostTagLinkEntity).delete({ postId: post.id });
            await manager.getRepository(PostEntity).delete({ id: post.id });
        });
    }

    private async seedTags() {
        const existingTags = await this.boardQueryService.listTags();

        if (existingTags.length > 0) {
            return existingTags;
        }

        return (await this.tags.save([{ name: "react" }, { name: "nest" }, { name: "boilerplate" }])).map((tag) =>
            PostTagEntity.from(tag)
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

        const savedPostIds: number[] = [];

        for (const post of posts) {
            savedPostIds.push(
                await this.insertPostWithTags(
                    post.request,
                    user,
                    await this.boardQueryService.resolveTags(post.request.tagIds),
                    post.createdAt
                )
            );
        }

        return savedPostIds;
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
