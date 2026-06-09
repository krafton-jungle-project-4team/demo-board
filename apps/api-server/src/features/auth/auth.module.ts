import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./controller/auth.controller";
import { AuthRepository } from "./database/auth.repository";
import {
    AUTH_COMMAND_PROVIDER,
    AUTH_OAUTH_PROVIDER,
    AUTH_QUERY_PROVIDER,
    OAuthAccountEntity,
    OAuthStateEntity,
    SessionEntity,
    UserEntity
} from "./domain";
import { GitHubOAuthClient } from "./infrastructure";
import { AuthCommandService } from "./service/auth-command.service";
import { AuthQueryService } from "./service/auth-query.service";

@Module({
    imports: [TypeOrmModule.forFeature([OAuthAccountEntity, OAuthStateEntity, SessionEntity, UserEntity])],
    controllers: [AuthController],
    providers: [
        AuthRepository,
        {
            provide: AUTH_QUERY_PROVIDER,
            useExisting: AuthRepository
        },
        {
            provide: AUTH_COMMAND_PROVIDER,
            useExisting: AuthRepository
        },
        GitHubOAuthClient,
        {
            provide: AUTH_OAUTH_PROVIDER,
            useExisting: GitHubOAuthClient
        },
        AuthCommandService,
        AuthQueryService
    ],
    exports: [AuthQueryService]
})
export class AuthModule {}
