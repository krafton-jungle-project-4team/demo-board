import { PostTagNameSchema, PostTagResponseSchema, type PostTagResponse } from "@nmm/shared";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("post_tags")
@Index("idx_post_tags_normalized_name_unique", ["normalizedName"], { unique: true })
export class PostTagEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ type: "varchar", length: 30 })
    name!: string;

    @Column({ name: "normalized_name", type: "varchar", length: 30 })
    normalizedName!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    static fromName(name: string): PostTagEntity {
        const postTagName = PostTagNameSchema.parse(name);
        const postTag = new PostTagEntity();
        postTag.name = postTagName;
        postTag.normalizedName = PostTagEntity.normalizeName(postTagName);

        return postTag;
    }

    static normalizeName(name: string) {
        return PostTagNameSchema.parse(name).toLocaleLowerCase("ko-KR");
    }

    toPostTagResponse(): PostTagResponse {
        return PostTagResponseSchema.parse({
            id: Number(this.id),
            name: this.name
        });
    }
}
