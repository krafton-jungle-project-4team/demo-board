import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { AddPostTagRequestSchema, PostIdParamsSchema, type AddPostTagResponse, type TagResponse } from "@nmm/shared";
import { PostTagCommandService } from "../service/post-tag-command.service";
import { PostTagQueryService } from "../service/post-tag-query.service";

@Controller("posts/:postId/tags")
export class PostTagController {
    constructor(
        private readonly postTagQueryService: PostTagQueryService,
        private readonly postTagCommandService: PostTagCommandService
    ) {}

    @Get()
    getPostTags(@Param() params: unknown): Promise<TagResponse[]> {
        const { postId } = PostIdParamsSchema.parse(params);

        return this.postTagQueryService.getPostTags(postId);
    }

    @Post()
    addPostTag(@Param() params: unknown, @Body() body: unknown): Promise<AddPostTagResponse> {
        const { postId } = PostIdParamsSchema.parse(params);
        const request = AddPostTagRequestSchema.parse(body);

        return this.postTagCommandService.addPostTag(postId, request);
    }
}
