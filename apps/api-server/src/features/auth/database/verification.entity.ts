import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("verification")
export class VerificationEntity {
    @PrimaryColumn({ type: "text" })
    id!: string;

    @Index("verification_identifier_idx")
    @Column({ type: "text" })
    identifier!: string;

    @Column({ type: "text" })
    value!: string;

    @Column({ name: "expiresAt", type: "timestamptz" })
    expiresAt!: Date;

    @Column({ name: "createdAt", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ name: "updatedAt", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}
