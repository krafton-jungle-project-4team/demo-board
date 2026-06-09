import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { ActiveUserGuard } from "./controller/active-user.guard";
import { AuthController } from "./controller/auth.controller";
import { SessionUserGuard } from "./controller/session-user.guard";
import { AuthTypeOrmRepository, BETTER_AUTH, createBetterAuth } from "./database";
import { AccountEntity, AUTH_REPOSITORY, SessionEntity, UserEntity, VerificationEntity } from "./domain";
import { AuthCommandService } from "./service/auth-command.service";
import { AuthQueryService } from "./service/auth-query.service";

@Module({
    imports: [TypeOrmModule.forFeature([AccountEntity, SessionEntity, UserEntity, VerificationEntity])],
    controllers: [AuthController],
    providers: [
        {
            provide: BETTER_AUTH,
            useFactory: createBetterAuth,
            inject: [DataSource]
        },
        AuthTypeOrmRepository,
        {
            provide: AUTH_REPOSITORY,
            useExisting: AuthTypeOrmRepository
        },
        AuthCommandService,
        AuthQueryService,
        ActiveUserGuard,
        SessionUserGuard
    ],
    exports: [BETTER_AUTH, AuthQueryService, ActiveUserGuard, SessionUserGuard]
})
export class AuthModule {}
