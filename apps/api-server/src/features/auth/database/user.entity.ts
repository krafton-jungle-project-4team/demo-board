import type { User, UserRole, UserStatus } from "@nmm/shared";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("user")
export class UserEntity {
    @PrimaryColumn({ type: "text" })
    id!: string;

    @Column({ type: "text" })
    name!: string;

    @Column({ type: "text", unique: true })
    email!: string;

    @Column({ name: "emailVerified", type: "boolean", default: false })
    emailVerified!: boolean;

    @Column({ type: "text", nullable: true })
    image!: string | null;

    @Column({ name: "createdAt", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ name: "updatedAt", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
    updatedAt!: Date;

    @Column({ type: "text", default: "USER" })
    role!: UserRole;

    @Column({ type: "text", default: "PENDING" })
    status!: UserStatus;

    static from(user: UserEntity): UserEntity {
        return Object.assign(new UserEntity(), {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
            role: user.role,
            status: user.status
        });
    }

    toUser(): User {
        return {
            id: this.id,
            email: this.email,
            name: this.name.trim() || null,
            image: this.image,
            role: this.role === "ADMIN" ? "ADMIN" : "USER",
            status: UserEntity.toUserStatus(this.status),
            createdAt: this.createdAt.toISOString()
        };
    }

    static toUserStatus(value: unknown): UserStatus {
        if (value === "ACTIVE" || value === "SUSPENDED") {
            return value;
        }

        return "PENDING";
    }
}
