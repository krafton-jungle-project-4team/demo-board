import { Body, Controller, Delete, Get, Param, Patch, Post as HttpPost, Query, UseGuards } from "@nestjs/common";
import { CreatePostRequestSchema, ListPostsQuerySchema, ResourceIdSchema, UpdatePostRequestSchema } from "@nmm/shared";
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
        return this.boardQueryService.findPosts(ListPostsQuerySchema.parse(query));
    }

    @Get(":id")
    async findPost(@Param("id") id: string) {
        return this.boardQueryService.findPost(ResourceIdSchema.parse(id));
    }

    @HttpPost()
    @UseGuards(ActiveUserGuard)
    async createPost(@Body() body: unknown, @CurrentAuth() claims: AuthClaims) {
        return this.boardCommandService.createPost(CreatePostRequestSchema.parse(body), claims);
    }

    @Patch(":id")
    @UseGuards(ActiveUserGuard)
    async updatePost(@Param("id") id: string, @Body() body: unknown, @CurrentAuth() claims: AuthClaims) {
        return this.boardCommandService.updatePost(
            ResourceIdSchema.parse(id),
            UpdatePostRequestSchema.parse(body),
            claims
        );
    }

    @Delete(":id")
    @UseGuards(ActiveUserGuard)
    async deletePost(@Param("id") id: string, @CurrentAuth() claims: AuthClaims) {
        return this.boardCommandService.deletePost(ResourceIdSchema.parse(id), claims);
    }
}
