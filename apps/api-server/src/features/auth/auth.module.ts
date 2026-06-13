import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./controller/auth.controller";
import { AuthUserEntity } from "./database";
import { AuthGuard } from "./guard/auth.guard";
import { AuthService } from "./service/auth.service";

@Module({
    imports: [TypeOrmModule.forFeature([AuthUserEntity])],
    controllers: [AuthController],
    providers: [AuthService, AuthGuard],
    exports: [AuthService, AuthGuard]
})
export class AuthModule {}
