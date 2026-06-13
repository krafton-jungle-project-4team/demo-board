import { Injectable } from "@nestjs/common";
import { PostListResponseSchema, type PostListQuery, type PostListResponse } from "@nmm/shared";
import { PostListQueryRepository } from "../database";

@Injectable()
export class PostListQueryService {
    constructor(private readonly postListQueryRepository: PostListQueryRepository) {}

    async getPostList(query: PostListQuery): Promise<PostListResponse> {
        const { items, totalItems } = await this.postListQueryRepository.findPostList(query);
        const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize);

        return PostListResponseSchema.parse({
            items,
            page: query.page,
            pageSize: query.pageSize,
            totalItems,
            totalPages,
            hasPreviousPage: query.page > 1,
            hasNextPage: totalPages > query.page
        });
    }
}
