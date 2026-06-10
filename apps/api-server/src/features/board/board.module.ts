import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth";
import { UserEntity } from "../auth/database";
import { CommentsController } from "./controller/comments.controller";
import { PostTagsController } from "./controller/post-tags.controller";
import { PostsController } from "./controller/posts.controller";
import { CommentEntity, PostEntity, PostTagEntity, PostTagLinkEntity } from "./database";
import { BoardCommandService } from "./service/board-command.service";
import { BoardQueryService } from "./service/board-query.service";

@Module({
    imports: [
        AuthModule,
        TypeOrmModule.forFeature([CommentEntity, PostEntity, PostTagEntity, PostTagLinkEntity, UserEntity])
    ],
    controllers: [CommentsController, PostTagsController, PostsController],
    providers: [BoardCommandService, BoardQueryService]
})
export class BoardModule {}
