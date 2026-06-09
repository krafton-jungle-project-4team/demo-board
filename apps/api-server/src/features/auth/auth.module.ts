import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./controller/auth.controller";
import { AuthRepository } from "./database/auth.repository";
import { OAuthAccountEntity } from "./database/oauth-account.entity";
import { OAuthStateEntity } from "./database/oauth-state.entity";
import { SessionEntity } from "./database/session.entity";
import { UserEntity } from "./database/user.entity";
import { AuthService } from "./service/auth.service";

@Module({
  imports: [TypeOrmModule.forFeature([OAuthAccountEntity, OAuthStateEntity, SessionEntity, UserEntity])],
  controllers: [AuthController],
  providers: [AuthRepository, AuthService],
  exports: [AuthService]
})
export class AuthModule {}
