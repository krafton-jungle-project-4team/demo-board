import { Module } from "@nestjs/common";
import { DatabaseModule } from "./common/database";
import { AuthModule } from "./features/auth";
import { BoardModule } from "./features/board";
import { HealthModule } from "./features/health";

@Module({
  imports: [DatabaseModule, AuthModule, BoardModule, HealthModule]
})
export class AppModule {}
