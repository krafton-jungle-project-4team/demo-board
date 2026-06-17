import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EstatePropertyEntity, EstateTransactionEntity } from "./database";
import { EstateAccessibilityController } from "./controller/estate-accessibility.controller";
import { EstateAiController } from "./controller/estate-ai.controller";
import { EstateController } from "./controller/estate.controller";
import { EstateAgentService } from "./service/estate-agent.service";
import { EstateAccessibilityService } from "./service/estate-accessibility.service";
import { EstateAiQueryService } from "./service/estate-ai-query.service";
import { EstateQueryService } from "./service/estate-query.service";

@Module({
    imports: [TypeOrmModule.forFeature([EstatePropertyEntity, EstateTransactionEntity])],
    controllers: [EstateController, EstateAiController, EstateAccessibilityController],
    providers: [EstateQueryService, EstateAiQueryService, EstateAgentService, EstateAccessibilityService]
})
export class EstateModule {}
