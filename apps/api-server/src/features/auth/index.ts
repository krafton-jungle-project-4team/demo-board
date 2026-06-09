export { AuthModule } from "./auth.module";
export { ActiveUserGuard } from "./controller/active-user.guard";
export { CurrentUser } from "./controller/current-user.decorator";
export { SessionUserGuard } from "./controller/session-user.guard";
export { BETTER_AUTH, type BetterAuth } from "./database";
export { AuthCommandService } from "./service/auth-command.service";
export { AuthQueryService, type AuthRequestContext } from "./service/auth-query.service";
export type { ActiveUser, UserRecord } from "./domain";
