import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

@Entity("board_comments")
@Index("idx_board_comments_post_id_parent_comment_id", ["postId", "parentCommentId"])
@Index("idx_board_comments_author_id", ["authorId"])
export class BoardCommentEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ name: "post_id", type: "bigint" })
    postId!: number;

    @Column({ name: "author_id", type: "bigint" })
    authorId!: number;

    @Column({ name: "parent_comment_id", type: "bigint", nullable: true })
    parentCommentId!: number | null;

    @Column({ type: "int" })
    depth!: 0 | 1;

    @Column({ type: "text" })
    content!: string;

    @DeleteDateColumn({ name: "deleted_at", type: "timestamptz" })
    deletedAt!: Date | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
