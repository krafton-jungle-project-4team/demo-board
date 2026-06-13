import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth";
import { BoardController } from "./controller/board.controller";
import { BoardCommentEntity, BoardPostEntity, BoardPostTagEntity, BoardTagEntity } from "./database";
import { BoardCommandService } from "./service/board-command.service";
import { BoardQueryService } from "./service/board-query.service";

@Module({
    imports: [
        AuthModule,
        TypeOrmModule.forFeature([BoardPostEntity, BoardTagEntity, BoardPostTagEntity, BoardCommentEntity])
    ],
    controllers: [BoardController],
    providers: [BoardQueryService, BoardCommandService]
})
export class BoardModule {}
