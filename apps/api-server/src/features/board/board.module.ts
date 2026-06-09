import { Module } from "@nestjs/common";
import { AuthModule } from "../auth";
import { CommentsController } from "./controller/comments.controller";
import { PostTagsController } from "./controller/post-tags.controller";
import { PostsController } from "./controller/posts.controller";
import { BoardRepository } from "./database/board.repository";
import { BoardService } from "./service/board.service";

@Module({
  imports: [AuthModule],
  controllers: [CommentsController, PostTagsController, PostsController],
  providers: [BoardRepository, BoardService]
})
export class BoardModule {}
