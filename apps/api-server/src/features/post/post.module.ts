import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostTagController } from "./controller/post-tag.controller";
import { TagController } from "./controller/tag.controller";
import { PostTagEntity, TagEntity } from "./database";
import { PostTagCommandService } from "./service/post-tag-command.service";
import { PostTagQueryService } from "./service/post-tag-query.service";
import { TagCommandService } from "./service/tag-command.service";
import { TagQueryService } from "./service/tag-query.service";

@Module({
    imports: [TypeOrmModule.forFeature([TagEntity, PostTagEntity])],
    controllers: [TagController, PostTagController],
    providers: [TagQueryService, TagCommandService, PostTagQueryService, PostTagCommandService]
})
export class PostModule {}
