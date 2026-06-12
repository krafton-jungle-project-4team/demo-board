import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExampleController } from "./controller/example.controller";
import { ExampleItemEntity } from "./database";
import { ExampleQueryService } from "./service/example-query.service";

@Module({
    imports: [TypeOrmModule.forFeature([ExampleItemEntity])],
    controllers: [ExampleController],
    providers: [ExampleQueryService]
})
export class ExampleModule {}
