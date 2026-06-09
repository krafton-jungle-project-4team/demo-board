import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth";
import { CommentsController } from "./controller/comments.controller";
import { PostTagsController } from "./controller/post-tags.controller";
import { PostsController } from "./controller/posts.controller";
import { BoardRepository } from "./database/board.repository";
import {
    BOARD_COMMAND_PROVIDER,
    BOARD_QUERY_PROVIDER,
    CommentEntity,
    PostEntity,
    PostTagEntity,
    PostTagLinkEntity
} from "./domain";
import { BoardCommandService } from "./service/board-command.service";
import { BoardQueryService } from "./service/board-query.service";

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([CommentEntity, PostEntity, PostTagEntity, PostTagLinkEntity])],
    controllers: [CommentsController, PostTagsController, PostsController],
    providers: [
        BoardRepository,
        {
            provide: BOARD_QUERY_PROVIDER,
            useExisting: BoardRepository
        },
        {
            provide: BOARD_COMMAND_PROVIDER,
            useExisting: BoardRepository
        },
        BoardCommandService,
        BoardQueryService
    ]
})
export class BoardModule {}
