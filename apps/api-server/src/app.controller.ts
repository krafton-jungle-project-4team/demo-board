import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiProperty, ApiTags } from "@nestjs/swagger";

class HealthResponseDto {
  @ApiProperty({ type: Boolean, example: true })
  ok!: boolean;
}

@ApiTags("app")
@Controller()
export class AppController {
  @Get("health")
  @ApiOkResponse({ type: HealthResponseDto })
  health() {
    return {
      ok: true
    };
  }
}
