import { TagNameSchema, TagResponseSchema, type TagResponse } from "@nmm/shared";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("tags")
@Index("idx_tags_normalized_name_unique", ["normalizedName"], { unique: true })
export class TagEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ type: "varchar", length: 30 })
    name!: string;

    @Column({ name: "normalized_name", type: "varchar", length: 30 })
    normalizedName!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    static fromName(name: string): TagEntity {
        const tagName = TagNameSchema.parse(name);
        const tag = new TagEntity();
        tag.name = tagName;
        tag.normalizedName = TagEntity.normalizeName(tagName);

        return tag;
    }

    static normalizeName(name: string) {
        return TagNameSchema.parse(name).toLocaleLowerCase("ko-KR");
    }

    toTagResponse(): TagResponse {
        return TagResponseSchema.parse({
            id: Number(this.id),
            name: this.name
        });
    }
}
