import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { BoardService } from "./board.service";
import { CommentsController } from "./comments.controller";
import { PostTagsController } from "./post-tags.controller";
import { PostsController } from "./posts.controller";

@Module({
  controllers: [AppController, AuthController, CommentsController, PostTagsController, PostsController],
  providers: [AuthService, BoardService]
})
export class AppModule {}
