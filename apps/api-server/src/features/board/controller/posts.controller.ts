import { Body, Controller, Delete, Get, Headers, Param, Patch, Post as HttpPost, Query } from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiBody,
    ApiCookieAuth,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags
} from "@nestjs/swagger";
import { ApiStandardErrorResponses } from "../../../common/http";
import { AuthQueryService } from "../../auth";
import { BoardCommandService } from "../service/board-command.service";
import { BoardQueryService } from "../service/board-query.service";
import {
    createPostRequestOpenApiSchema,
    deletePostApiResponseOpenApiSchema,
    postApiResponseOpenApiSchema,
    postListApiResponseOpenApiSchema,
    postSortValues,
    postViewValues,
    updatePostRequestOpenApiSchema
} from "./board.openapi";

@ApiTags("posts")
@ApiStandardErrorResponses()
@Controller("posts")
export class PostsController {
    constructor(
        private readonly authQueryService: AuthQueryService,
        private readonly boardCommandService: BoardCommandService,
        private readonly boardQueryService: BoardQueryService
    ) {}

    @Get()
    @ApiOperation({
        summary: "게시글 목록 조회",
        description: "검색어, 태그, 페이지, 정렬, 보기 옵션을 받아 게시글 목록을 반환한다."
    })
    @ApiQuery({ name: "q", required: false, type: String })
    @ApiQuery({ name: "tagId", required: false, type: String })
    @ApiQuery({ name: "page", required: false, type: Number })
    @ApiQuery({ name: "pageSize", required: false, type: Number })
    @ApiQuery({
        name: "sort",
        required: false,
        enum: postSortValues
    })
    @ApiQuery({ name: "view", required: false, enum: postViewValues })
    @ApiOkResponse({ schema: postListApiResponseOpenApiSchema })
    async findPosts(@Query() query: unknown) {
        return this.boardQueryService.findPosts(query);
    }

    @Get(":id")
    @ApiOperation({ summary: "게시글 단건 조회" })
    @ApiParam({ name: "id", type: String, example: "post-1" })
    @ApiOkResponse({ schema: postApiResponseOpenApiSchema })
    async findPost(@Param("id") id: string) {
        return this.boardQueryService.findPost(id);
    }

    @HttpPost()
    @ApiCookieAuth("sessionCookie")
    @ApiBearerAuth("session")
    @ApiOperation({ summary: "게시글 생성" })
    @ApiBody({ schema: createPostRequestOpenApiSchema })
    @ApiCreatedResponse({ schema: postApiResponseOpenApiSchema })
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
    @ApiCookieAuth("sessionCookie")
    @ApiBearerAuth("session")
    @ApiOperation({ summary: "게시글 수정" })
    @ApiParam({ name: "id", type: String, example: "post-1" })
    @ApiBody({ schema: updatePostRequestOpenApiSchema })
    @ApiOkResponse({ schema: postApiResponseOpenApiSchema })
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
    @ApiCookieAuth("sessionCookie")
    @ApiBearerAuth("session")
    @ApiOperation({ summary: "게시글 삭제" })
    @ApiParam({ name: "id", type: String, example: "post-1" })
    @ApiOkResponse({ schema: deletePostApiResponseOpenApiSchema })
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
