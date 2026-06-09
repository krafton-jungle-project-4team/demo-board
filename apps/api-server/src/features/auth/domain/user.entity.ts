import { Column, Entity, PrimaryColumn } from "typeorm";
import type { UserRole, UserStatus } from "@nmm/shared";

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
}
