import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("session")
export class SessionEntity {
    @PrimaryColumn({ type: "text" })
    id!: string;

    @Column({ name: "expiresAt", type: "timestamptz" })
    expiresAt!: Date;

    @Column({ type: "text", unique: true })
    token!: string;

    @Column({ name: "createdAt", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ name: "updatedAt", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
    updatedAt!: Date;

    @Column({ name: "ipAddress", type: "text", nullable: true })
    ipAddress!: string | null;

    @Column({ name: "userAgent", type: "text", nullable: true })
    userAgent!: string | null;

    @Index("session_userId_idx")
    @Column({ name: "userId", type: "text" })
    userId!: string;
}
