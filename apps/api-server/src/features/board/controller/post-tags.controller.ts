import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiStandardErrorResponses } from "../../../common/http";
import { BoardQueryService } from "../service/board-query.service";
import { postTagListApiResponseOpenApiSchema } from "./board.openapi";

@ApiTags("post-tags")
@ApiStandardErrorResponses()
@Controller("post-tags")
export class PostTagsController {
    constructor(private readonly boardQueryService: BoardQueryService) {}

    @Get()
    @ApiOperation({
        summary: "게시글 태그 목록 조회",
        description: "태그는 별도 PostTag 데이터로 관리한다. 일반 사용자용 태그 생성 API는 제공하지 않는다."
    })
    @ApiOkResponse({ schema: postTagListApiResponseOpenApiSchema })
    async findTags() {
        return this.boardQueryService.findTags();
    }
}
