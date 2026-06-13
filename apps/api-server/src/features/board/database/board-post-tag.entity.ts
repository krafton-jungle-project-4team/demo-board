import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("board_post_tags")
@Index("idx_board_post_tags_post_id", ["postId"])
@Index("idx_board_post_tags_tag_id", ["tagId"])
@Index("idx_board_post_tags_post_id_tag_id_unique", ["postId", "tagId"], { unique: true })
export class BoardPostTagEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ name: "post_id", type: "bigint" })
    postId!: number;

    @Column({ name: "tag_id", type: "bigint" })
    tagId!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
