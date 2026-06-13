import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import {
    AddPostTagRequestSchema,
    CreatePostTagRequestSchema,
    PostIdParamsSchema,
    type AddPostTagResponse,
    type CreatePostTagResponse,
    type PostTagResponse
} from "@nmm/shared";
import { PostTagCommandService } from "../service/post-tag-command.service";
import { PostTagQueryService } from "../service/post-tag-query.service";

@Controller("posts")
export class PostTagController {
    constructor(
        private readonly postTagQueryService: PostTagQueryService,
        private readonly postTagCommandService: PostTagCommandService
    ) {}

    @Get("tags")
    getPostTags(): Promise<PostTagResponse[]> {
        return this.postTagQueryService.getPostTags();
    }

    @Post("tags")
    createPostTag(@Body() body: unknown): Promise<CreatePostTagResponse> {
        const request = CreatePostTagRequestSchema.parse(body);

        return this.postTagCommandService.createPostTag(request);
    }

    @Get(":postId/tags")
    getPostTagsByPostId(@Param() params: unknown): Promise<PostTagResponse[]> {
        const { postId } = PostIdParamsSchema.parse(params);

        return this.postTagQueryService.getPostTagsByPostId(postId);
    }

    @Post(":postId/tags")
    addPostTag(@Param() params: unknown, @Body() body: unknown): Promise<AddPostTagResponse> {
        const { postId } = PostIdParamsSchema.parse(params);
        const request = AddPostTagRequestSchema.parse(body);

        return this.postTagCommandService.addPostTag(postId, request);
    }
}
