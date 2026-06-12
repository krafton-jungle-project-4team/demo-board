import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateTagRequestSchema, type CreateTagResponse, type TagResponse } from "@nmm/shared";
import { TagCommandService } from "../service/tag-command.service";
import { TagQueryService } from "../service/tag-query.service";

@Controller("tags")
export class TagController {
    constructor(
        private readonly tagQueryService: TagQueryService,
        private readonly tagCommandService: TagCommandService
    ) {}

    @Get()
    getTags(): Promise<TagResponse[]> {
        return this.tagQueryService.getTags();
    }

    @Post()
    createTag(@Body() body: unknown): Promise<CreateTagResponse> {
        const request = CreateTagRequestSchema.parse(body);

        return this.tagCommandService.createTag(request);
    }
}
