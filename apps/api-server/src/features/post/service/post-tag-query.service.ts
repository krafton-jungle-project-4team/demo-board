import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { PostTagResponse } from "@nmm/shared";
import { Repository } from "typeorm";
import { PostTagAssignmentEntity, PostTagEntity } from "../database";

@Injectable()
export class PostTagQueryService {
    constructor(@InjectRepository(PostTagEntity) private readonly postTags: Repository<PostTagEntity>) {}

    async getPostTags(): Promise<PostTagResponse[]> {
        const postTags = await this.postTags.find({
            order: {
                normalizedName: "ASC",
                id: "ASC"
            }
        });

        return postTags.map((postTag) => postTag.toPostTagResponse());
    }

    async getPostTagsByPostId(postId: number): Promise<PostTagResponse[]> {
        // TODO: 게시글 도메인이 추가되면 postId 존재 여부를 검증한다.
        const postTags = await this.postTags
            .createQueryBuilder("postTag")
            .innerJoin(PostTagAssignmentEntity, "assignment", "assignment.post_tag_id = postTag.id")
            .where("assignment.post_id = :postId", { postId })
            .orderBy("postTag.normalized_name", "ASC")
            .addOrderBy("postTag.id", "ASC")
            .getMany();

        return postTags.map((postTag) => postTag.toPostTagResponse());
    }
}
