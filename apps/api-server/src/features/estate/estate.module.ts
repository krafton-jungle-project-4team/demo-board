import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EstateTransactionEntity } from "./database";
import { EstateController } from "./controller/estate.controller";
import { EstateQueryService } from "./service/estate-query.service";

@Module({
    imports: [TypeOrmModule.forFeature([EstateTransactionEntity])],
    controllers: [EstateController],
    providers: [EstateQueryService]
})
export class EstateModule {}
