import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { createTypeOrmOptions } from "./database.config";
import { DatabaseSchemaValidationService } from "./database-schema-validation.service";

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: createTypeOrmOptions
        })
    ],
    providers: [DatabaseSchemaValidationService]
})
export class DatabaseModule {}
