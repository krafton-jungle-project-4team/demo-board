import {
    CreatePostResponseSchema,
    DeletePostResponseSchema,
    PostSchema,
    UpdatePostResponseSchema,
    type CreatePostRequest,
    type CreatePostResponse,
    type DeletePostResponse,
    type Post,
    type UpdatePostRequest,
    type UpdatePostResponse
} from "@nmm/shared";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("posts")
export class PostEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ type: "text" })
    title!: string;

    @Column({ type: "text" })
    content!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    static fromCreatePostRequest(request: CreatePostRequest): PostEntity {
        const post = new PostEntity();

        post.title = request.title;
        post.content = request.content;

        return post;
    }

    updateFromRequest(request: UpdatePostRequest): void {
        if (request.title !== undefined) {
            this.title = request.title;
        }

        if (request.content !== undefined) {
            this.content = request.content;
        }
    }

    toPost(): Post {
        return PostSchema.parse({
            id: Number(this.id),
            title: this.title,
            content: this.content,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        });
    }

    toCreatePostResponse(): CreatePostResponse {
        return CreatePostResponseSchema.parse({
            id: Number(this.id)
        });
    }

    toUpdatePostResponse(): UpdatePostResponse {
        return UpdatePostResponseSchema.parse({
            id: Number(this.id)
        });
    }

    toDeletePostResponse(): DeletePostResponse {
        return DeletePostResponseSchema.parse({
            id: Number(this.id)
        });
    }
}
