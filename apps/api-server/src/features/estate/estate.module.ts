import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EstateAccessibilityController } from "./controller/estate-accessibility.controller";
import { EstateAiController } from "./controller/estate-ai.controller";
import { EstateController } from "./controller/estate.controller";
import { EstatePropertyEntity, EstateTransactionEntity } from "./database";
import { EstateAccessibilityService } from "./service/estate-accessibility.service";
import { EstateAiQueryService } from "./service/estate-ai-query.service";
import { EstateQueryService } from "./service/estate-query.service";
import { TmapCacheService } from "./service/tmap-cache.service";
import { TmapClientService } from "./service/tmap-client.service";

@Module({
    imports: [TypeOrmModule.forFeature([EstatePropertyEntity, EstateTransactionEntity])],
    controllers: [EstateController, EstateAccessibilityController, EstateAiController],
    providers: [
        EstateQueryService,
        EstateAccessibilityService,
        EstateAiQueryService,
        TmapCacheService,
        TmapClientService
    ]
})
export class EstateModule {}
