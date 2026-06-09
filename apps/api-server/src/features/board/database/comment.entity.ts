import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("comments")
export class CommentEntity {
  @PrimaryColumn({ type: "text" })
  id!: string;

  @Column({ name: "post_id", type: "text" })
  postId!: string;

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
