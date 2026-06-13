import { Controller, Get, Query } from "@nestjs/common";
import { PostListQuerySchema, type PostListResponse } from "@nmm/shared";
import { PostListQueryService } from "../service/post-list-query.service";

@Controller("posts")
export class PostListQueryController {
    constructor(private readonly postListQueryService: PostListQueryService) {}

    @Get()
    getPostList(@Query() query: unknown): Promise<PostListResponse> {
        const postListQuery = PostListQuerySchema.parse(query);

        return this.postListQueryService.getPostList(postListQuery);
    }
}
