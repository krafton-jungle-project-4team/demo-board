import { AddPostTagResponseSchema, type AddPostTagResponse } from "@nmm/shared";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

type PostTagInput = {
    postId: number;
    tagId: number;
};

@Entity("post_tags")
@Index("idx_post_tags_post_id", ["postId"])
@Index("idx_post_tags_tag_id", ["tagId"])
@Index("idx_post_tags_post_id_tag_id_unique", ["postId", "tagId"], { unique: true })
export class PostTagEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ name: "post_id", type: "bigint" })
    postId!: number;

    @Column({ name: "tag_id", type: "bigint" })
    tagId!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    static from(input: PostTagInput): PostTagEntity {
        const postTag = new PostTagEntity();
        postTag.postId = input.postId;
        postTag.tagId = input.tagId;

        return postTag;
    }

    toAddPostTagResponse(): AddPostTagResponse {
        return AddPostTagResponseSchema.parse({
            id: Number(this.id),
            postId: Number(this.postId),
            tagId: Number(this.tagId)
        });
    }
}
