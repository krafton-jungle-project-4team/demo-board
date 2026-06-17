import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EstateTransactionEntity } from "./database";
import { EstateAiController } from "./controller/estate-ai.controller";
import { EstateController } from "./controller/estate.controller";
import { EstateAgentService } from "./service/estate-agent.service";
import { EstateAiQueryService } from "./service/estate-ai-query.service";
import { EstateQueryService } from "./service/estate-query.service";

@Module({
    imports: [TypeOrmModule.forFeature([EstateTransactionEntity])],
    controllers: [EstateController, EstateAiController],
    providers: [EstateQueryService, EstateAiQueryService, EstateAgentService]
})
export class EstateModule {}
