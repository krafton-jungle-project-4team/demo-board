import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import {
    CreatePostRequestSchema,
    CreatePostResponseSchema,
    DeletePostParamsSchema,
    DeletePostResponseSchema,
    PostDetailParamsSchema,
    PostDetailResponseSchema,
    PostListResponseSchema,
    UpdatePostParamsSchema,
    UpdatePostRequestSchema,
    UpdatePostResponseSchema,
    type DeletePostResponse,
    type PostDetailResponse,
    type PostListResponse,
    type UpdatePostResponse,
    type CreatePostResponse
} from "@nmm/shared";
import { PostsCommandService } from "../service/posts-command.service";
import { PostsQueryService } from "../service/posts-query.service";

@Controller("posts")
export class PostsController {
    constructor(
        private readonly postsCommandService: PostsCommandService,
        private readonly postsQueryService: PostsQueryService
    ) {}

    @Post()
    async createPost(@Body() body: unknown): Promise<CreatePostResponse> {
        const request = CreatePostRequestSchema.parse(body);
        const response = await this.postsCommandService.createPost(request);

        return CreatePostResponseSchema.parse(response);
    }

    @Get()
    async getPosts(): Promise<PostListResponse> {
        const response = await this.postsQueryService.getPosts();

        return PostListResponseSchema.parse(response);
    }

    @Get(":postId")
    async getPost(@Param("postId") postId: string): Promise<PostDetailResponse> {
        const params = PostDetailParamsSchema.parse({
            postId: Number(postId)
        });
        const response = await this.postsQueryService.getPost(params.postId);

        return PostDetailResponseSchema.parse(response);
    }

    @Patch(":postId")
    async updatePost(@Param("postId") postId: string, @Body() body: unknown): Promise<UpdatePostResponse> {
        const params = UpdatePostParamsSchema.parse({
            postId: Number(postId)
        });
        const request = UpdatePostRequestSchema.parse(body);
        const response = await this.postsCommandService.updatePost(params.postId, request);

        return UpdatePostResponseSchema.parse(response);
    }

    @Delete(":postId")
    async deletePost(@Param("postId") postId: string): Promise<DeletePostResponse> {
        const params = DeletePostParamsSchema.parse({
            postId: Number(postId)
        });
        const response = await this.postsCommandService.deletePost(params.postId);

        return DeletePostResponseSchema.parse(response);
    }
}
