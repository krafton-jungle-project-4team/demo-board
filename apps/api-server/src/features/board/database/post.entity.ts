import type { Post, PostTag } from "@nmm/shared";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("posts")
export class PostEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ type: "text" })
    title!: string;

    @Column({ type: "text" })
    excerpt!: string;

    @Column({ type: "text" })
    content!: string;

    @Column({ name: "author_id", type: "text" })
    authorId!: string;

    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    toPost(tags: PostTag[], authorName: string): Post {
        return {
            id: Number(this.id),
            title: this.title,
            excerpt: this.excerpt,
            content: this.content,
            authorId: this.authorId,
            authorName,
            createdAt: new Date(this.createdAt).toISOString(),
            updatedAt: new Date(this.updatedAt).toISOString(),
            tags
        };
    }
}
