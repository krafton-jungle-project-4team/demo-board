import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EstateAiController } from "./controller/estate-ai.controller";
import { EstateTransactionEntity } from "./database";
import { EstateAiQueryService } from "./service/estate-ai-query.service";

@Module({
    imports: [TypeOrmModule.forFeature([EstateTransactionEntity])],
    controllers: [EstateAiController],
    providers: [EstateAiQueryService]
})
export class EstateModule {}
