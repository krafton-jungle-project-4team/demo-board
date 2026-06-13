import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EstateTransactionEntity } from "./database";

@Module({
    imports: [TypeOrmModule.forFeature([EstateTransactionEntity])]
})
export class EstateModule {}
