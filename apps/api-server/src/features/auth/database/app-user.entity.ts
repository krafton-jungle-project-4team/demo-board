import { AuthUserSchema, type AuthUser } from "@nmm/shared";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("app_users")
export class AppUserEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ name: "auth_user_id", type: "text", unique: true })
    authUserId!: string;

    @Column({ type: "text", unique: true })
    email!: string;

    @Column({ type: "text" })
    name!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    toAuthUser(): AuthUser {
        return AuthUserSchema.parse({
            id: Number(this.id),
            authUserId: this.authUserId,
            email: this.email,
            name: this.name
        });
    }
}
