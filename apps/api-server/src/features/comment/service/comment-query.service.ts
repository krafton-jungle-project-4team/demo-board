import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { CommentListQuery, CommentListResponse, CommentReplyResponse } from "@nmm/shared";
import { In, IsNull, Repository } from "typeorm";
import { CommentEntity } from "../database";

@Injectable()
export class CommentQueryService {
    constructor(@InjectRepository(CommentEntity) private readonly comments: Repository<CommentEntity>) {}

    async getComments(postId: number, query: CommentListQuery): Promise<CommentListResponse> {
        const [parentComments, totalCount] = await this.comments.findAndCount({
            order: {
                createdAt: "ASC"
            },
            skip: (query.page - 1) * query.pageSize,
            take: query.pageSize,
            where: {
                postId,
                parentCommentId: IsNull()
            },
            withDeleted: true
        });
        const parentCommentIds = parentComments.map((comment) => comment.id);
        const repliesByParentId = await this.getRepliesByParentId(parentCommentIds);

        return {
            items: parentComments.map((comment) => comment.toCommentResponse(repliesByParentId.get(comment.id) ?? [])),
            pageInfo: {
                page: query.page,
                pageSize: query.pageSize,
                totalCount,
                totalPages: Math.ceil(totalCount / query.pageSize)
            }
        };
    }

    private async getRepliesByParentId(parentCommentIds: number[]) {
        if (parentCommentIds.length === 0) {
            return new Map<number, CommentReplyResponse[]>();
        }

        const replies = await this.comments.find({
            order: {
                createdAt: "ASC"
            },
            where: {
                parentCommentId: In(parentCommentIds)
            },
            withDeleted: true
        });

        return replies.reduce((repliesByParentId, reply) => {
            if (reply.parentCommentId === null) {
                return repliesByParentId;
            }

            const parentReplies = repliesByParentId.get(reply.parentCommentId) ?? [];
            parentReplies.push(reply.toReplyResponse());
            repliesByParentId.set(reply.parentCommentId, parentReplies);

            return repliesByParentId;
        }, new Map<number, CommentReplyResponse[]>());
    }
}
