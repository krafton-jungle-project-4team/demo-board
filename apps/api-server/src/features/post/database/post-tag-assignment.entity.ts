import { AddPostTagResponseSchema, type AddPostTagResponse } from "@nmm/shared";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

type PostTagAssignmentInput = {
    postId: number;
    postTagId: number;
};

@Entity("post_tag_assignments")
@Index("idx_post_tag_assignments_post_id", ["postId"])
@Index("idx_post_tag_assignments_post_tag_id", ["postTagId"])
@Index("idx_post_tag_assignments_post_id_post_tag_id_unique", ["postId", "postTagId"], { unique: true })
export class PostTagAssignmentEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ name: "post_id", type: "bigint" })
    postId!: number;

    @Column({ name: "post_tag_id", type: "bigint" })
    postTagId!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    static from(input: PostTagAssignmentInput): PostTagAssignmentEntity {
        const assignment = new PostTagAssignmentEntity();
        assignment.postId = input.postId;
        assignment.postTagId = input.postTagId;

        return assignment;
    }

    toAddPostTagResponse(): AddPostTagResponse {
        return AddPostTagResponseSchema.parse({
            id: Number(this.id),
            postId: Number(this.postId),
            postTagId: Number(this.postTagId)
        });
    }
}
