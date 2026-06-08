import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PostsController } from "./posts.controller";

@Module({
  controllers: [AppController, PostsController]
})
export class AppModule {}
