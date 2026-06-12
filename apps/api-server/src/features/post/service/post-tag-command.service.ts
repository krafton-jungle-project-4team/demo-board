import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { AddPostTagRequest, AddPostTagResponse } from "@nmm/shared";
import { Repository } from "typeorm";
import { PostTagEntity, TagEntity } from "../database";
import { createTagNotFoundError } from "../post.errors";
import { isUniqueConstraintError } from "./query-error";

@Injectable()
export class PostTagCommandService {
    constructor(
        @InjectRepository(PostTagEntity) private readonly postTags: Repository<PostTagEntity>,
        @InjectRepository(TagEntity) private readonly tags: Repository<TagEntity>
    ) {}

    async addPostTag(postId: number, request: AddPostTagRequest): Promise<AddPostTagResponse> {
        await this.assertTagExists(request.tagId);
        // TODO: 게시글 도메인이 추가되면 postId 존재 여부를 검증한다.
        // TODO: 마이그레이션 정책이 정해지면 post_tags.tag_id FK를 추가한다.
        const existingPostTag = await this.findPostTag(postId, request.tagId);

        if (existingPostTag) {
            return existingPostTag.toAddPostTagResponse();
        }

        try {
            const postTag = await this.postTags.save(
                PostTagEntity.from({
                    postId,
                    tagId: request.tagId
                })
            );

            return postTag.toAddPostTagResponse();
        } catch (error) {
            if (!isUniqueConstraintError(error)) {
                throw error;
            }

            const postTag = await this.findPostTag(postId, request.tagId);

            if (!postTag) {
                throw error;
            }

            return postTag.toAddPostTagResponse();
        }
    }

    private async assertTagExists(tagId: number) {
        const tag = await this.tags.findOne({
            where: {
                id: tagId
            }
        });

        if (!tag) {
            throw createTagNotFoundError();
        }
    }

    private findPostTag(postId: number, tagId: number) {
        return this.postTags.findOne({
            where: {
                postId,
                tagId
            }
        });
    }
}
