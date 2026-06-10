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
}
