import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("post_tags")
export class PostTagEntity {
    @PrimaryColumn({ type: "text" })
    id!: string;

    @Column({ type: "text", unique: true })
    name!: string;
}
