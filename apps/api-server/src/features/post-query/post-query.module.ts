import { Module } from "@nestjs/common";
import { PostListQueryController } from "./controller/post-list-query.controller";
import { PostListQueryRepository, PostQueryDatabaseInitializer } from "./database";
import { PostListQueryService } from "./service/post-list-query.service";

@Module({
    controllers: [PostListQueryController],
    providers: [PostQueryDatabaseInitializer, PostListQueryRepository, PostListQueryService]
})
export class PostQueryModule {}
