import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CommentController } from "./controller/comment.controller";
import { CommentEntity } from "./database";
import { CommentCommandService } from "./service/comment-command.service";
import { CommentQueryService } from "./service/comment-query.service";

@Module({
    imports: [TypeOrmModule.forFeature([CommentEntity])],
    controllers: [CommentController],
    providers: [CommentCommandService, CommentQueryService]
})
export class CommentModule {}
