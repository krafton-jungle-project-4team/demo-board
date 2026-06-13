import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { CommentCommandResponse, CreateCommentRequest, UpdateCommentRequest } from "@nmm/shared";
import { Repository } from "typeorm";
import { COMMENT_ERROR, createCommentError } from "../comment.errors";
import { CommentEntity } from "../database";

const TEMP_COMMENT_AUTHOR = {
    id: 1,
    nickname: "익명"
} as const;

@Injectable()
export class CommentCommandService {
    constructor(@InjectRepository(CommentEntity) private readonly comments: Repository<CommentEntity>) {}

    async createComment(postId: number, request: CreateCommentRequest): Promise<CommentCommandResponse> {
        const comment = await this.comments.save(
            this.comments.create({
                postId,
                authorId: TEMP_COMMENT_AUTHOR.id,
                authorNickname: TEMP_COMMENT_AUTHOR.nickname,
                parentCommentId: null,
                depth: 0,
                content: request.content
            })
        );

        return {
            id: comment.id
        };
    }

    async createReply(parentCommentId: number, request: CreateCommentRequest): Promise<CommentCommandResponse> {
        const parentComment = await this.comments.findOne({
            where: {
                id: parentCommentId
            }
        });

        if (!parentComment) {
            throw createCommentError(COMMENT_ERROR.NOT_FOUND);
        }

        if (parentComment.depth !== 0) {
            throw createCommentError(COMMENT_ERROR.REPLY_DEPTH_EXCEEDED);
        }

        const reply = await this.comments.save(
            this.comments.create({
                postId: parentComment.postId,
                authorId: TEMP_COMMENT_AUTHOR.id,
                authorNickname: TEMP_COMMENT_AUTHOR.nickname,
                parentCommentId: parentComment.id,
                depth: 1,
                content: request.content
            })
        );

        return {
            id: reply.id
        };
    }

    async updateComment(commentId: number, request: UpdateCommentRequest): Promise<CommentCommandResponse> {
        const comment = await this.findCommentIncludingDeleted(commentId);

        if (comment.deletedAt) {
            throw createCommentError(COMMENT_ERROR.DELETED_COMMENT_UPDATE);
        }

        comment.content = request.content;
        await this.comments.save(comment);

        return {
            id: comment.id
        };
    }

    async deleteComment(commentId: number): Promise<CommentCommandResponse> {
        const comment = await this.findCommentIncludingDeleted(commentId);

        if (!comment.deletedAt) {
            await this.comments.softRemove(comment);
        }

        return {
            id: comment.id
        };
    }

    private async findCommentIncludingDeleted(commentId: number) {
        const comment = await this.comments.findOne({
            where: {
                id: commentId
            },
            withDeleted: true
        });

        if (!comment) {
            throw createCommentError(COMMENT_ERROR.NOT_FOUND);
        }

        return comment;
    }
}
