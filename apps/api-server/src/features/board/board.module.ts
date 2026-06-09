import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth";
import { CommentEntity } from "./database/comment.entity";
import { CommentsController } from "./controller/comments.controller";
import { PostTagsController } from "./controller/post-tags.controller";
import { PostsController } from "./controller/posts.controller";
import { BoardRepository } from "./database/board.repository";
import { PostEntity } from "./database/post.entity";
import { PostTagLinkEntity } from "./database/post-tag-link.entity";
import { PostTagEntity } from "./database/post-tag.entity";
import { BoardService } from "./service/board.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([CommentEntity, PostEntity, PostTagEntity, PostTagLinkEntity])],
  controllers: [CommentsController, PostTagsController, PostsController],
  providers: [BoardRepository, BoardService]
})
export class BoardModule {}
