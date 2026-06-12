import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostTagController } from "./controller/post-tag.controller";
import { PostTagAssignmentEntity, PostTagEntity } from "./database";
import { PostTagCommandService } from "./service/post-tag-command.service";
import { PostTagQueryService } from "./service/post-tag-query.service";

@Module({
    imports: [TypeOrmModule.forFeature([PostTagEntity, PostTagAssignmentEntity])],
    controllers: [PostTagController],
    providers: [PostTagQueryService, PostTagCommandService]
})
export class PostModule {}
