import { AuthUserSchema, getSongpaBoardDongName, type AuthUser, type SongpaBoardDongCode } from "@nmm/shared";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("auth_users")
export class AuthUserEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ name: "auth_user_id", type: "text", unique: true })
    authUserId!: string;

    @Column({ type: "text", unique: true })
    email!: string;

    @Column({ type: "text" })
    name!: string;

    @Column({ name: "residence_dong_code", type: "varchar", length: 5, nullable: true })
    residenceDongCode!: SongpaBoardDongCode | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    toAuthUser(): AuthUser {
        return AuthUserSchema.parse({
            id: Number(this.id),
            authUserId: this.authUserId,
            email: this.email,
            name: this.name,
            residenceDongCode: this.residenceDongCode,
            residenceDongName: getSongpaBoardDongName(this.residenceDongCode)
        });
    }
}
