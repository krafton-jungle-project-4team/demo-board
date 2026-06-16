import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import {
    BoardCommandResponseSchema,
    type AuthUser,
    type BoardCommentWriteRequest,
    type BoardCommandResponse,
    type BoardPostCreateRequest,
    type BoardPostUpdateRequest,
    type SongpaBoardDongCode
} from "@nmm/shared";
import { DataSource, IsNull, Repository, type EntityManager } from "typeorm";
import { BOARD_ERRORS, createBoardError } from "../board.errors";
import { BoardCommentEntity, BoardPostEntity, BoardPostTagEntity, BoardTagEntity } from "../database";
import { isUniqueConstraintError } from "./query-error";

type UpsertedBoardTag = {
    id: number;
    name: string;
};

@Injectable()
export class BoardCommandService {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        @InjectRepository(BoardPostEntity) private readonly posts: Repository<BoardPostEntity>,
        @InjectRepository(BoardCommentEntity) private readonly comments: Repository<BoardCommentEntity>
    ) {}

    async createPost(authUser: AuthUser, request: BoardPostCreateRequest): Promise<BoardCommandResponse> {
        const dongCode = this.resolvePostDongCode(authUser);
        const postId = await this.dataSource.transaction(async (manager) => {
            const post = await manager.save(
                manager.create(BoardPostEntity, {
                    authorId: authUser.id,
                    dongCode,
                    title: request.title,
                    content: request.content
                })
            );

            await this.replacePostTags(manager, Number(post.id), request.tags);

            return Number(post.id);
        });

        return toCommandResponse(postId);
    }

    async updatePost(
        authUser: AuthUser,
        postId: number,
        request: BoardPostUpdateRequest
    ): Promise<BoardCommandResponse> {
        await this.dataSource.transaction(async (manager) => {
            const post = await this.findPostOrThrow(manager, postId);
            this.assertOwner(authUser, Number(post.authorId));

            post.title = request.title;
            post.content = request.content;

            await manager.save(post);
            await this.replacePostTags(manager, postId, request.tags);
        });

        return toCommandResponse(postId);
    }

    async deletePost(authUser: AuthUser, postId: number): Promise<BoardCommandResponse> {
        await this.dataSource.transaction(async (manager) => {
            const post = await this.findPostOrThrow(manager, postId);
            this.assertOwner(authUser, Number(post.authorId));

            await manager.delete(BoardCommentEntity, { postId });
            await manager.delete(BoardPostTagEntity, { postId });
            await manager.delete(BoardPostEntity, { id: postId });
        });

        return toCommandResponse(postId);
    }

    async createComment(
        authUser: AuthUser,
        postId: number,
        request: BoardCommentWriteRequest
    ): Promise<BoardCommandResponse> {
        const commentId = await this.dataSource.transaction(async (manager) => {
            await this.findPostOrThrow(manager, postId);
            const comment = await manager.save(
                manager.create(BoardCommentEntity, {
                    postId,
                    authorId: authUser.id,
                    parentCommentId: null,
                    depth: 0,
                    content: request.content
                })
            );

            return Number(comment.id);
        });

        return toCommandResponse(commentId);
    }

    async createReply(
        authUser: AuthUser,
        parentCommentId: number,
        request: BoardCommentWriteRequest
    ): Promise<BoardCommandResponse> {
        const replyId = await this.dataSource.transaction(async (manager) => {
            const parentComment = await this.findCommentOrThrow(manager, parentCommentId);
            await this.findPostOrThrow(manager, Number(parentComment.postId));

            if (parentComment.depth !== 0 || parentComment.parentCommentId !== null) {
                throw createBoardError(BOARD_ERRORS.REPLY_DEPTH_EXCEEDED);
            }

            const reply = await manager.save(
                manager.create(BoardCommentEntity, {
                    postId: parentComment.postId,
                    authorId: authUser.id,
                    parentCommentId: parentComment.id,
                    depth: 1,
                    content: request.content
                })
            );

            return Number(reply.id);
        });

        return toCommandResponse(replyId);
    }

    async updateComment(
        authUser: AuthUser,
        commentId: number,
        request: BoardCommentWriteRequest
    ): Promise<BoardCommandResponse> {
        const comment = await this.findCommentIncludingDeletedOrThrow(commentId);
        this.assertOwner(authUser, Number(comment.authorId));

        if (comment.deletedAt) {
            throw createBoardError(BOARD_ERRORS.DELETED_COMMENT_UPDATE);
        }

        comment.content = request.content;
        await this.comments.save(comment);

        return toCommandResponse(commentId);
    }

    async deleteComment(authUser: AuthUser, commentId: number): Promise<BoardCommandResponse> {
        const comment = await this.findCommentIncludingDeletedOrThrow(commentId);
        this.assertOwner(authUser, Number(comment.authorId));

        if (!comment.deletedAt) {
            await this.comments.softRemove(comment);
        }

        return toCommandResponse(commentId);
    }

    private async replacePostTags(manager: EntityManager, postId: number, tagNames: string[]) {
        await manager.delete(BoardPostTagEntity, { postId });

        const tags = await this.upsertTags(manager, tagNames);

        if (tags.length === 0) {
            return;
        }

        await manager.save(
            tags.map((tag) =>
                manager.create(BoardPostTagEntity, {
                    postId,
                    tagId: tag.id
                })
            )
        );
    }

    private async upsertTags(manager: EntityManager, tagNames: string[]) {
        const uniqueTagNames = getUniqueTagNames(tagNames);
        const tags: UpsertedBoardTag[] = [];

        for (const tagName of uniqueTagNames) {
            tags.push(await this.upsertTag(manager, tagName));
        }

        return tags;
    }

    private async upsertTag(manager: EntityManager, tagName: string): Promise<UpsertedBoardTag> {
        const normalizedName = BoardTagEntity.normalizeName(tagName);
        const existingTag = await manager.findOne(BoardTagEntity, {
            where: {
                normalizedName
            }
        });

        if (existingTag) {
            return {
                id: Number(existingTag.id),
                name: existingTag.name
            };
        }

        try {
            const tag = await manager.save(
                manager.create(BoardTagEntity, {
                    name: tagName,
                    normalizedName
                })
            );

            return {
                id: Number(tag.id),
                name: tag.name
            };
        } catch (error) {
            if (!isUniqueConstraintError(error)) {
                throw error;
            }

            const tag = await manager.findOne(BoardTagEntity, {
                where: {
                    normalizedName
                }
            });

            if (!tag) {
                throw error;
            }

            return {
                id: Number(tag.id),
                name: tag.name
            };
        }
    }

    private async findPostOrThrow(manager: EntityManager, postId: number) {
        const post = await manager.findOne(BoardPostEntity, {
            where: {
                id: postId
            }
        });

        if (!post) {
            throw createBoardError(BOARD_ERRORS.POST_NOT_FOUND);
        }

        return post;
    }

    private async findCommentOrThrow(manager: EntityManager, commentId: number) {
        const comment = await manager.findOne(BoardCommentEntity, {
            where: {
                id: commentId
            }
        });

        if (!comment) {
            throw createBoardError(BOARD_ERRORS.COMMENT_NOT_FOUND);
        }

        return comment;
    }

    private async findCommentIncludingDeletedOrThrow(commentId: number) {
        const comment = await this.comments.findOne({
            where: {
                id: commentId,
                parentCommentId: IsNull()
            },
            withDeleted: true
        });

        if (comment) {
            return comment;
        }

        const reply = await this.comments.findOne({
            where: {
                id: commentId
            },
            withDeleted: true
        });

        if (!reply) {
            throw createBoardError(BOARD_ERRORS.COMMENT_NOT_FOUND);
        }

        return reply;
    }

    private assertOwner(authUser: AuthUser, ownerId: number) {
        if (authUser.id !== ownerId) {
            throw createBoardError(BOARD_ERRORS.FORBIDDEN);
        }
    }

    private resolvePostDongCode(authUser: AuthUser): SongpaBoardDongCode {
        if (!authUser.residenceDongCode) {
            throw createBoardError(BOARD_ERRORS.DONG_RESIDENCE_REQUIRED);
        }

        return authUser.residenceDongCode;
    }
}

function getUniqueTagNames(tagNames: string[]) {
    const tagNamesByNormalizedName = new Map<string, string>();

    for (const tagName of tagNames) {
        const normalizedName = BoardTagEntity.normalizeName(tagName);

        if (!tagNamesByNormalizedName.has(normalizedName)) {
            tagNamesByNormalizedName.set(normalizedName, tagName);
        }
    }

    return [...tagNamesByNormalizedName.values()];
}

function toCommandResponse(id: number) {
    return BoardCommandResponseSchema.parse({
        id
    });
}
