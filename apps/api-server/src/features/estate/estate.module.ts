import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EstateTransactionEntity } from "./database";
import { EstateAiController } from "./controller/estate-ai.controller";
import { EstateController } from "./controller/estate.controller";
import { EstateAiQueryService } from "./service/estate-ai-query.service";
import { EstateQueryService } from "./service/estate-query.service";

@Module({
    imports: [TypeOrmModule.forFeature([EstateTransactionEntity])],
    controllers: [EstateController, EstateAiController],
    providers: [EstateQueryService, EstateAiQueryService]
})
export class EstateModule {}
