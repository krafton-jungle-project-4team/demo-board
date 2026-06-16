import type { SongpaBoardDongCode } from "@nmm/shared";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("board_posts")
@Index("idx_board_posts_author_id", ["authorId"])
export class BoardPostEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ name: "author_id", type: "bigint" })
    authorId!: number;

    @Column({ name: "dong_code", type: "varchar", length: 5 })
    dongCode!: SongpaBoardDongCode;

    @Column({ type: "text" })
    title!: string;

    @Column({ type: "text" })
    content!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
