import { Module } from "@nestjs/common";
import { AuthController } from "./controller/auth.controller";
import { AuthRepository } from "./database/auth.repository";
import { AuthService } from "./service/auth.service";

@Module({
  controllers: [AuthController],
  providers: [AuthRepository, AuthService],
  exports: [AuthService]
})
export class AuthModule {}
