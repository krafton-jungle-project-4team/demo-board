import { ExampleResponseSchema, type ExampleResponse } from "@nmm/shared";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("example_items")
export class ExampleItemEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ type: "text" })
    message!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    toExampleResponse(): ExampleResponse {
        return ExampleResponseSchema.parse({
            id: Number(this.id),
            message: this.message,
            createdAt: this.createdAt.toISOString()
        });
    }
}
