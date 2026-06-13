import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostsController } from "./controller/posts.controller";
import { PostEntity } from "./database";
import { PostsCommandService } from "./service/posts-command.service";
import { PostsQueryService } from "./service/posts-query.service";

@Module({
    imports: [TypeOrmModule.forFeature([PostEntity])],
    controllers: [PostsController],
    providers: [PostsCommandService, PostsQueryService]
})
export class PostsModule {}
