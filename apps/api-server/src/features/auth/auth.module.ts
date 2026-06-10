import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { ActiveUserGuard } from "./controller/active-user.guard";
import { AuthController } from "./controller/auth.controller";
import { SessionUserGuard } from "./controller/session-user.guard";
import {
    AccountEntity,
    BETTER_AUTH,
    createBetterAuth,
    SessionEntity,
    UserEntity,
    VerificationEntity
} from "./database";
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
        AuthCommandService,
        AuthQueryService,
        ActiveUserGuard,
        SessionUserGuard
    ],
    exports: [BETTER_AUTH, AuthQueryService, ActiveUserGuard, SessionUserGuard]
})
export class AuthModule {}
