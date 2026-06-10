import type { PostTag } from "@nmm/shared";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("post_tags")
export class PostTagEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ type: "text", unique: true })
    name!: string;

    static from(tag: PostTagEntity): PostTagEntity {
        return Object.assign(new PostTagEntity(), {
            id: Number(tag.id),
            name: tag.name
        });
    }

    toPostTag(): PostTag {
        return {
            id: Number(this.id),
            name: this.name
        };
    }
}
