import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { TagResponse } from "@nmm/shared";
import { Repository } from "typeorm";
import { TagEntity } from "../database";

@Injectable()
export class TagQueryService {
    constructor(@InjectRepository(TagEntity) private readonly tags: Repository<TagEntity>) {}

    async getTags(): Promise<TagResponse[]> {
        const tags = await this.tags.find({
            order: {
                normalizedName: "ASC",
                id: "ASC"
            }
        });

        return tags.map((tag) => tag.toTagResponse());
    }
}
