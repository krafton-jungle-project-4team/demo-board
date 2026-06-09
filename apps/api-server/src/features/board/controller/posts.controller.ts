import { Body, Controller, Delete, Get, Headers, Param, Patch, Post as HttpPost, Query } from "@nestjs/common";
import { AuthQueryService } from "../../auth";
import { BoardCommandService } from "../service/board-command.service";
import { BoardQueryService } from "../service/board-query.service";

@Controller("posts")
export class PostsController {
    constructor(
        private readonly authQueryService: AuthQueryService,
        private readonly boardCommandService: BoardCommandService,
        private readonly boardQueryService: BoardQueryService
    ) {}

    @Get()
    async findPosts(@Query() query: unknown) {
        return this.boardQueryService.findPosts(query);
    }

    @Get(":id")
    async findPost(@Param("id") id: string) {
        return this.boardQueryService.findPost(id);
    }

    @HttpPost()
    async createPost(
        @Body() body: unknown,
        @Headers("authorization") authorization?: string,
        @Headers("cookie") cookieHeader?: string
    ) {
        return this.boardCommandService.createPost(
            body,
            await this.authQueryService.requireUser({ authorization, cookieHeader })
        );
    }

    @Patch(":id")
    async updatePost(
        @Param("id") id: string,
        @Body() body: unknown,
        @Headers("authorization") authorization?: string,
        @Headers("cookie") cookieHeader?: string
    ) {
        return this.boardCommandService.updatePost(
            id,
            body,
            await this.authQueryService.requireUser({ authorization, cookieHeader })
        );
    }

    @Delete(":id")
    async deletePost(
        @Param("id") id: string,
        @Headers("authorization") authorization?: string,
        @Headers("cookie") cookieHeader?: string
    ) {
        return this.boardCommandService.deletePost(
            id,
            await this.authQueryService.requireUser({ authorization, cookieHeader })
        );
    }
}
