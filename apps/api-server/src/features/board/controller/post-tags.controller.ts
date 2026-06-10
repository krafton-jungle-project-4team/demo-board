import { Controller, Get } from "@nestjs/common";
import { PostTagSchema, type PostTag } from "@nmm/shared";
import { BoardQueryService } from "../service/board-query.service";

@Controller("post-tags")
export class PostTagsController {
    constructor(private readonly boardQueryService: BoardQueryService) {}

    @Get()
    async findTags(): Promise<PostTag[]> {
        const tags: PostTag[] = await this.boardQueryService.findTags();

        return PostTagSchema.array().parse(tags);
    }
}
