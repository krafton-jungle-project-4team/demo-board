import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { TagResponse } from "@nmm/shared";
import { Repository } from "typeorm";
import { PostTagEntity, TagEntity } from "../database";

@Injectable()
export class PostTagQueryService {
    constructor(@InjectRepository(TagEntity) private readonly tags: Repository<TagEntity>) {}

    async getPostTags(postId: number): Promise<TagResponse[]> {
        // TODO: 게시글 도메인이 추가되면 postId 존재 여부를 검증한다.
        const tags = await this.tags
            .createQueryBuilder("tag")
            .innerJoin(PostTagEntity, "postTag", "postTag.tag_id = tag.id")
            .where("postTag.post_id = :postId", { postId })
            .orderBy("tag.normalized_name", "ASC")
            .addOrderBy("tag.id", "ASC")
            .getMany();

        return tags.map((tag) => tag.toTagResponse());
    }
}
