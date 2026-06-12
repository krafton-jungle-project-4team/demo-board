import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
    CreatePostTagResponseSchema,
    type AddPostTagRequest,
    type AddPostTagResponse,
    type CreatePostTagRequest,
    type CreatePostTagResponse
} from "@nmm/shared";
import { Repository } from "typeorm";
import { PostTagAssignmentEntity, PostTagEntity } from "../database";
import { createPostTagNotFoundError } from "../post.errors";
import { isUniqueConstraintError } from "./query-error";

@Injectable()
export class PostTagCommandService {
    constructor(
        @InjectRepository(PostTagEntity) private readonly postTags: Repository<PostTagEntity>,
        @InjectRepository(PostTagAssignmentEntity)
        private readonly postTagAssignments: Repository<PostTagAssignmentEntity>
    ) {}

    async createPostTag(request: CreatePostTagRequest): Promise<CreatePostTagResponse> {
        const normalizedName = PostTagEntity.normalizeName(request.name);
        const existingPostTag = await this.findPostTagByNormalizedName(normalizedName);

        if (existingPostTag) {
            return this.toCreatePostTagResponse(existingPostTag);
        }

        try {
            const postTag = await this.postTags.save(PostTagEntity.fromName(request.name));

            return this.toCreatePostTagResponse(postTag);
        } catch (error) {
            if (!isUniqueConstraintError(error)) {
                throw error;
            }

            const postTag = await this.findPostTagByNormalizedName(normalizedName);

            if (!postTag) {
                throw error;
            }

            return this.toCreatePostTagResponse(postTag);
        }
    }

    async addPostTag(postId: number, request: AddPostTagRequest): Promise<AddPostTagResponse> {
        await this.assertPostTagExists(request.postTagId);
        // TODO: 게시글 도메인이 추가되면 postId 존재 여부를 검증한다.
        // TODO: 마이그레이션 정책이 정해지면 post_tag_assignments.post_tag_id FK를 추가한다.
        const existingAssignment = await this.findPostTagAssignment(postId, request.postTagId);

        if (existingAssignment) {
            return existingAssignment.toAddPostTagResponse();
        }

        try {
            const assignment = await this.postTagAssignments.save(
                PostTagAssignmentEntity.from({
                    postId,
                    postTagId: request.postTagId
                })
            );

            return assignment.toAddPostTagResponse();
        } catch (error) {
            if (!isUniqueConstraintError(error)) {
                throw error;
            }

            const assignment = await this.findPostTagAssignment(postId, request.postTagId);

            if (!assignment) {
                throw error;
            }

            return assignment.toAddPostTagResponse();
        }
    }

    private async assertPostTagExists(postTagId: number) {
        const postTag = await this.postTags.findOne({
            where: {
                id: postTagId
            }
        });

        if (!postTag) {
            throw createPostTagNotFoundError();
        }
    }

    private findPostTagByNormalizedName(normalizedName: string) {
        return this.postTags.findOne({
            where: {
                normalizedName
            }
        });
    }

    private findPostTagAssignment(postId: number, postTagId: number) {
        return this.postTagAssignments.findOne({
            where: {
                postId,
                postTagId
            }
        });
    }

    private toCreatePostTagResponse(postTag: PostTagEntity): CreatePostTagResponse {
        return CreatePostTagResponseSchema.parse({
            id: Number(postTag.id)
        });
    }
}
