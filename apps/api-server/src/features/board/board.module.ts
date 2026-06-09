import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth";
import { CommentsController } from "./controller/comments.controller";
import { PostTagsController } from "./controller/post-tags.controller";
import { PostsController } from "./controller/posts.controller";
import { BoardTypeOrmRepository } from "./database/board.repository";
import { BOARD_REPOSITORY, CommentEntity, PostEntity, PostTagEntity, PostTagLinkEntity } from "./domain";
import { BoardCommandService } from "./service/board-command.service";
import { BoardQueryService } from "./service/board-query.service";

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([CommentEntity, PostEntity, PostTagEntity, PostTagLinkEntity])],
    controllers: [CommentsController, PostTagsController, PostsController],
    providers: [
        BoardTypeOrmRepository,
        {
            provide: BOARD_REPOSITORY,
            useExisting: BoardTypeOrmRepository
        },
        BoardCommandService,
        BoardQueryService
    ]
})
export class BoardModule {}
