import { Module } from "@nestjs/common";
import { AuthModule } from "./features/auth";
import { BoardModule } from "./features/board";
import { HealthModule } from "./features/health";

@Module({
  imports: [AuthModule, BoardModule, HealthModule]
})
export class AppModule {}
