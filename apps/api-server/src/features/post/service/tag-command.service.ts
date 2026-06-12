import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateTagResponseSchema, type CreateTagRequest, type CreateTagResponse } from "@nmm/shared";
import { Repository } from "typeorm";
import { TagEntity } from "../database";
import { isUniqueConstraintError } from "./query-error";

@Injectable()
export class TagCommandService {
    constructor(@InjectRepository(TagEntity) private readonly tags: Repository<TagEntity>) {}

    async createTag(request: CreateTagRequest): Promise<CreateTagResponse> {
        const normalizedName = TagEntity.normalizeName(request.name);
        const existingTag = await this.findTagByNormalizedName(normalizedName);

        if (existingTag) {
            return this.toCreateTagResponse(existingTag);
        }

        try {
            const tag = await this.tags.save(TagEntity.fromName(request.name));

            return this.toCreateTagResponse(tag);
        } catch (error) {
            if (!isUniqueConstraintError(error)) {
                throw error;
            }

            const tag = await this.findTagByNormalizedName(normalizedName);

            if (!tag) {
                throw error;
            }

            return this.toCreateTagResponse(tag);
        }
    }

    private findTagByNormalizedName(normalizedName: string) {
        return this.tags.findOne({
            where: {
                normalizedName
            }
        });
    }

    private toCreateTagResponse(tag: TagEntity): CreateTagResponse {
        return CreateTagResponseSchema.parse({
            id: Number(tag.id)
        });
    }
}
