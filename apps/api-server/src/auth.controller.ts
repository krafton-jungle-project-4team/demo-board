import { Body, Controller, Get, Headers, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { AuthSessionResponseDto, LoginDto, SignUpDto, UserDto } from "./posts.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  @ApiOperation({ summary: "회원가입" })
  @ApiBody({ type: SignUpDto })
  @ApiCreatedResponse({ type: AuthSessionResponseDto })
  signUp(@Body() body: SignUpDto) {
    return this.authService.signUp(body);
  }

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "로그인" })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthSessionResponseDto })
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Get("me")
  @ApiBearerAuth("session")
  @ApiOperation({ summary: "현재 로그인 사용자 조회" })
  @ApiOkResponse({ type: UserDto })
  me(@Headers("authorization") authorization?: string) {
    return this.authService.requireUser(authorization);
  }
}
