import { Body, Controller, Delete, Get, Param, Patch, Post as HttpPost, Query, UseGuards } from "@nestjs/common";
import {
    CreatePostRequestSchema,
    DeletePostResponseSchema,
    ListPostsQuerySchema,
    PostListResponseSchema,
    PostSchema,
    ResourceIdSchema,
    UpdatePostRequestSchema
} from "@nmm/shared";
import { ActiveUserGuard, CurrentAuth, type AuthClaims } from "../../auth";
import { BoardCommandService } from "../service/board-command.service";
import { BoardQueryService } from "../service/board-query.service";

@Controller("posts")
export class PostsController {
    constructor(
        private readonly boardCommandService: BoardCommandService,
        private readonly boardQueryService: BoardQueryService
    ) {}

    @Get()
    async findPosts(@Query() query: unknown) {
        const response = await this.boardQueryService.findPosts(ListPostsQuerySchema.parse(query));

        return PostListResponseSchema.parse(response);
    }

    @Get(":id")
    async findPost(@Param("id") id: string) {
        const post = await this.boardQueryService.findPost(ResourceIdSchema.parse(id));

        return PostSchema.parse(post);
    }

    @HttpPost()
    @UseGuards(ActiveUserGuard)
    async createPost(@Body() body: unknown, @CurrentAuth() claims: AuthClaims) {
        const post = await this.boardCommandService.createPost(CreatePostRequestSchema.parse(body), claims);

        return PostSchema.parse(post);
    }

    @Patch(":id")
    @UseGuards(ActiveUserGuard)
    async updatePost(@Param("id") id: string, @Body() body: unknown, @CurrentAuth() claims: AuthClaims) {
        const post = await this.boardCommandService.updatePost(
            ResourceIdSchema.parse(id),
            UpdatePostRequestSchema.parse(body),
            claims
        );

        return PostSchema.parse(post);
    }

    @Delete(":id")
    @UseGuards(ActiveUserGuard)
    async deletePost(@Param("id") id: string, @CurrentAuth() claims: AuthClaims) {
        const response = await this.boardCommandService.deletePost(ResourceIdSchema.parse(id), claims);

        return DeletePostResponseSchema.parse(response);
    }
}
