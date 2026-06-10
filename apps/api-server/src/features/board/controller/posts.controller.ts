import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
    CreatePostRequestSchema,
    CreatePostResponseSchema,
    DeletePostResponseSchema,
    ListPostsQuerySchema,
    PostListResponseSchema,
    PostSchema,
    ResourceIdSchema,
    UpdatePostRequestSchema,
    UpdatePostResponseSchema,
    type CreatePostRequest,
    type CreatePostResponse,
    type DeletePostResponse,
    type ListPostsQuery,
    type Post as BoardPost,
    type PostListResponse,
    type UpdatePostRequest,
    type UpdatePostResponse
} from "@nmm/shared";
import { ActiveAccountGuard, CurrentAuth, type AuthClaims } from "../../auth";
import { BoardCommandService } from "../service/board-command.service";
import { BoardQueryService } from "../service/board-query.service";

@Controller("posts")
export class PostsController {
    constructor(
        private readonly boardCommandService: BoardCommandService,
        private readonly boardQueryService: BoardQueryService
    ) {}

    @Get()
    async findPosts(@Query() query: unknown): Promise<PostListResponse> {
        const request: ListPostsQuery = ListPostsQuerySchema.parse(query);
        const response: PostListResponse = await this.boardQueryService.findPosts(request);

        return PostListResponseSchema.parse(response);
    }

    @Get(":id")
    async findPost(@Param("id") id: string): Promise<BoardPost> {
        const post: BoardPost = await this.boardQueryService.findPost(ResourceIdSchema.parse(id));

        return PostSchema.parse(post);
    }

    @Post()
    @UseGuards(ActiveAccountGuard)
    async createPost(@Body() body: unknown, @CurrentAuth() claims: AuthClaims): Promise<CreatePostResponse> {
        const request: CreatePostRequest = CreatePostRequestSchema.parse(body);
        const response: CreatePostResponse = await this.boardCommandService.createPost(request, claims);

        return CreatePostResponseSchema.parse(response);
    }

    @Patch(":id")
    @UseGuards(ActiveAccountGuard)
    async updatePost(
        @Param("id") id: string,
        @Body() body: unknown,
        @CurrentAuth() claims: AuthClaims
    ): Promise<UpdatePostResponse> {
        const request: UpdatePostRequest = UpdatePostRequestSchema.parse(body);
        const response: UpdatePostResponse = await this.boardCommandService.updatePost(
            ResourceIdSchema.parse(id),
            request,
            claims
        );

        return UpdatePostResponseSchema.parse(response);
    }

    @Delete(":id")
    @UseGuards(ActiveAccountGuard)
    async deletePost(@Param("id") id: string, @CurrentAuth() claims: AuthClaims): Promise<DeletePostResponse> {
        const response: DeletePostResponse = await this.boardCommandService.deletePost(
            ResourceIdSchema.parse(id),
            claims
        );

        return DeletePostResponseSchema.parse(response);
    }
}
