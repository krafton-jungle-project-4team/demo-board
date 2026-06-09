import { Controller, Get } from "@nestjs/common";
import { BoardQueryService } from "../service/board-query.service";

@Controller("post-tags")
export class PostTagsController {
    constructor(private readonly boardQueryService: BoardQueryService) {}

    @Get()
    async findTags() {
        return this.boardQueryService.findTags();
    }
}
