import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("post_tags")
export class PostTagEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ type: "text", unique: true })
    name!: string;
}
