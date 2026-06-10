import type { Comment } from "@nmm/shared";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("comments")
export class CommentEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ name: "post_id", type: "bigint" })
    postId!: number;

    @Column({ type: "text" })
    content!: string;

    @Column({ name: "author_id", type: "text" })
    authorId!: string;

    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    toComment(authorName: string): Comment {
        return {
            id: Number(this.id),
            postId: Number(this.postId),
            content: this.content,
            authorId: this.authorId,
            authorName,
            createdAt: new Date(this.createdAt).toISOString(),
            updatedAt: new Date(this.updatedAt).toISOString()
        };
    }
}
