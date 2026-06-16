import type { SongpaBoardDongCode } from "@nmm/shared";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export const BOARD_POST_MODERATION_STATUS_UNCHECKED = "unchecked";
export const BOARD_POST_MODERATION_STATUS_VISIBLE = "visible";
export const BOARD_POST_MODERATION_STATUS_HELD = "held";

export const BOARD_POST_MODERATION_STATUSES = [
    BOARD_POST_MODERATION_STATUS_UNCHECKED,
    BOARD_POST_MODERATION_STATUS_VISIBLE,
    BOARD_POST_MODERATION_STATUS_HELD
] as const;

export type BoardPostModerationStatus = (typeof BOARD_POST_MODERATION_STATUSES)[number];

@Entity("board_posts")
@Index("idx_board_posts_author_id", ["authorId"])
@Index("idx_board_posts_moderation_status", ["moderationStatus"])
@Index("idx_board_posts_moderation_status_checked_at", ["moderationStatus", "moderationCheckedAt"])
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

    @Column({
        name: "moderation_status",
        type: "varchar",
        length: 16,
        default: BOARD_POST_MODERATION_STATUS_UNCHECKED
    })
    moderationStatus!: BoardPostModerationStatus;

    @Column({ name: "moderation_held_reason", type: "text", nullable: true })
    moderationHeldReason!: string | null;

    @Column({ name: "moderation_checked_at", type: "timestamptz", nullable: true })
    moderationCheckedAt!: Date | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
