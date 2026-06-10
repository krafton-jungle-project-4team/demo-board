import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import {
    type CreateCommentRequest,
    type CreateCommentResponse,
    type CreatePostRequest,
    type CreatePostResponse,
    type DeleteCommentResponse,
    type DeletePostResponse,
    type UpdateCommentRequest,
    type UpdateCommentResponse,
    type UpdatePostRequest,
    type UpdatePostResponse
} from "@nmm/shared";
import { DataSource, In, Repository } from "typeorm";
import { appErrors } from "../../../app-errors";
import type { AuthClaims } from "../../auth/auth.model";
import { CommentEntity, PostEntity, PostTagEntity, PostTagLinkEntity } from "../database";

@Injectable()
export class BoardCommandService {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        @InjectRepository(PostEntity) private readonly posts: Repository<PostEntity>,
        @InjectRepository(PostTagEntity) private readonly tags: Repository<PostTagEntity>,
        @InjectRepository(CommentEntity) private readonly comments: Repository<CommentEntity>
    ) {}

    async createPost(request: CreatePostRequest, claims: AuthClaims): Promise<CreatePostResponse> {
        const tags = await this.resolveTags(request.tagIds);
        const postId = await this.insertPostWithTags(request, claims, tags);

        return { postId };
    }

    async updatePost(id: number, request: UpdatePostRequest, claims: AuthClaims): Promise<UpdatePostResponse> {
        const post = await this.findExistingPost(id);

        this.assertOwner(post, claims);
        const tags = request.tagIds === undefined ? undefined : await this.resolveTags(request.tagIds);
        const postId = Number(post.id);

        post.title = request.title ?? post.title;
        post.excerpt = request.excerpt ?? post.excerpt;
        post.content = request.content ?? post.content;
        post.updatedAt = new Date();
        await this.savePostWithTags(post, tags);

        return { postId };
    }

    async deletePost(id: number, claims: AuthClaims): Promise<DeletePostResponse> {
        const post = await this.findExistingPost(id);
        const postId = Number(post.id);

        this.assertOwner(post, claims);
        await this.deletePostWithComments(post);

        return { postId };
    }

    async createComment(
        postId: number,
        request: CreateCommentRequest,
        claims: AuthClaims
    ): Promise<CreateCommentResponse> {
        await this.findExistingPost(postId);
        const now = new Date();
        const savedComment = await this.comments.save(
            this.comments.create({
                postId,
                content: request.content,
                authorId: claims.userId,
                createdAt: now,
                updatedAt: now
            })
        );
        const commentId = Number(savedComment.id);

        return { commentId };
    }

    async updateComment(
        postId: number,
        commentId: number,
        request: UpdateCommentRequest,
        claims: AuthClaims
    ): Promise<UpdateCommentResponse> {
        await this.findExistingPost(postId);

        const comment = await this.findExistingComment(postId, commentId);
        const savedCommentId = Number(comment.id);

        this.assertOwner(comment, claims);

        comment.content = request.content ?? comment.content;
        comment.updatedAt = new Date();
        await this.comments.save(comment);

        return { commentId: savedCommentId };
    }

    async deleteComment(postId: number, commentId: number, claims: AuthClaims): Promise<DeleteCommentResponse> {
        await this.findExistingPost(postId);

        const comment = await this.findExistingComment(postId, commentId);
        const savedCommentId = Number(comment.id);

        this.assertOwner(comment, claims);
        await this.comments.delete({ id: comment.id });

        return { commentId: savedCommentId };
    }

    private async findExistingPost(id: number): Promise<PostEntity> {
        const post = await this.posts.findOneBy({ id });

        if (!post) {
            throw appErrors.boardPostNotFound();
        }

        return post;
    }

    private async findExistingComment(postId: number, commentId: number): Promise<CommentEntity> {
        const comment = await this.comments.findOneBy({
            id: commentId,
            postId
        });

        if (!comment) {
            throw appErrors.boardCommentNotFound();
        }

        return comment;
    }

    private async resolveTags(tagIds: number[]) {
        const uniqueTagIds = [...new Set(tagIds)];
        const tags = uniqueTagIds.length === 0 ? [] : await this.tags.findBy({ id: In(uniqueTagIds) });
        const tagById = new Map(tags.map((tag) => [Number(tag.id), tag]));
        const hasUnknownTag = uniqueTagIds.some((tagId) => !tagById.has(tagId));

        if (hasUnknownTag) {
            throw appErrors.boardUnknownTags();
        }

        const resolvedTags = uniqueTagIds.map((tagId) => tagById.get(tagId) as PostTagEntity);

        return resolvedTags;
    }

    private assertOwner(resource: { authorId: string }, claims: Pick<AuthClaims, "role" | "userId">) {
        if (resource.authorId !== claims.userId && claims.role !== "ADMIN") {
            throw appErrors.boardNotResourceOwner();
        }
    }

    private async insertPostWithTags(
        request: CreatePostRequest,
        claims: Pick<AuthClaims, "userId">,
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
                    authorId: claims.userId,
                    createdAt: new Date(createdAt),
                    updatedAt: new Date(createdAt)
                })
            );
            const savedPostId = Number(savedPost.id);

            if (tags.length > 0) {
                const links = tags.map((tag) => ({ postId: savedPostId, tagId: tag.id }));
                await postTagLinks.save(links);
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
                    const links = tags.map((tag) => ({ postId: post.id, tagId: tag.id }));
                    await postTagLinks.save(links);
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
}
