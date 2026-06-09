import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("posts")
export class PostEntity {
    @PrimaryColumn({ type: "text" })
    id!: string;

    @Column({ type: "text" })
    title!: string;

    @Column({ type: "text" })
    excerpt!: string;

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
