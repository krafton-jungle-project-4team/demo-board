import { BoardTagNameSchema, BoardTagResponseSchema, type BoardTagResponse } from "@nmm/shared";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("board_tags")
@Index("idx_board_tags_normalized_name_unique", ["normalizedName"], { unique: true })
export class BoardTagEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ type: "varchar", length: 30 })
    name!: string;

    @Column({ name: "normalized_name", type: "varchar", length: 30 })
    normalizedName!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    static normalizeName(name: string) {
        return BoardTagNameSchema.parse(name).toLocaleLowerCase("ko-KR");
    }

    toBoardTagResponse(): BoardTagResponse {
        return BoardTagResponseSchema.parse({
            id: Number(this.id),
            name: this.name
        });
    }
}
