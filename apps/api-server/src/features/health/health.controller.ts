import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { apiSuccessSchema, ApiStandardErrorResponses, zodToOpenApiSchema } from "../../common/http";

const healthApiResponseOpenApiSchema = apiSuccessSchema(
    zodToOpenApiSchema(
        z.object({
            ok: z.boolean()
        })
    )
);

@ApiTags("health")
@ApiStandardErrorResponses()
@Controller()
export class HealthController {
    @Get("health")
    @ApiOkResponse({ schema: healthApiResponseOpenApiSchema })
    health() {
        return {
            ok: true
        };
    }
}
