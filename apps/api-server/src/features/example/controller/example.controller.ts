import { Controller, Get } from "@nestjs/common";
import type { ExampleResponse } from "@nmm/shared";
import { ExampleQueryService } from "../service/example-query.service";

@Controller("example")
export class ExampleController {
    constructor(private readonly exampleQueryService: ExampleQueryService) {}

    @Get()
    getExample(): Promise<ExampleResponse> {
        return this.exampleQueryService.getExample();
    }
}
