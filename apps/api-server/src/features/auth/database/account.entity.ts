import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("account")
export class AccountEntity {
    @PrimaryColumn({ type: "text" })
    id!: string;

    @Column({ name: "accountId", type: "text" })
    accountId!: string;

    @Column({ name: "providerId", type: "text" })
    providerId!: string;

    @Index("account_userId_idx")
    @Column({ name: "userId", type: "text" })
    userId!: string;

    @Column({ name: "accessToken", type: "text", nullable: true })
    accessToken!: string | null;

    @Column({ name: "refreshToken", type: "text", nullable: true })
    refreshToken!: string | null;

    @Column({ name: "idToken", type: "text", nullable: true })
    idToken!: string | null;

    @Column({ name: "accessTokenExpiresAt", type: "timestamptz", nullable: true })
    accessTokenExpiresAt!: Date | null;

    @Column({ name: "refreshTokenExpiresAt", type: "timestamptz", nullable: true })
    refreshTokenExpiresAt!: Date | null;

    @Column({ type: "text", nullable: true })
    scope!: string | null;

    @Column({ type: "text", nullable: true })
    password!: string | null;

    @Column({ name: "createdAt", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ name: "updatedAt", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}
