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

    @Column({ name: "author_name", type: "text" })
    authorName!: string;

    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    static from(comment: CommentEntity): CommentEntity {
        return Object.assign(new CommentEntity(), {
            id: Number(comment.id),
            postId: Number(comment.postId),
            content: comment.content,
            authorId: comment.authorId,
            authorName: comment.authorName,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt)
        });
    }

    toComment(): Comment {
        return {
            id: Number(this.id),
            postId: Number(this.postId),
            content: this.content,
            authorId: this.authorId,
            authorName: this.authorName,
            createdAt: new Date(this.createdAt).toISOString(),
            updatedAt: new Date(this.updatedAt).toISOString()
        };
    }
}
