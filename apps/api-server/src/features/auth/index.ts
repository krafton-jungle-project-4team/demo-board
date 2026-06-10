export { AuthModule } from "./auth.module";
export { ActiveAccountGuard } from "./controller/active-account.guard";
export { CurrentAuth } from "./controller/current-auth.decorator";
export { SessionUserGuard } from "./controller/session-user.guard";
export { BETTER_AUTH, type BetterAuth } from "./database";
export { AuthCommandService } from "./service/auth-command.service";
export { AuthQueryService, type AuthRequestContext } from "./service/auth-query.service";
export type { AuthClaims, UserRecord } from "./auth.model";
