import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./controller/auth.controller";
import { AppUserEntity } from "./database";
import { AuthGuard } from "./guard/auth.guard";
import { AuthService } from "./service/auth.service";

@Module({
    imports: [TypeOrmModule.forFeature([AppUserEntity])],
    controllers: [AuthController],
    providers: [AuthService, AuthGuard],
    exports: [AuthGuard]
})
export class AuthModule {}
