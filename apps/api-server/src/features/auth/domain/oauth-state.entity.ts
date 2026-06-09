import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("oauth_states")
export class OAuthStateEntity {
    @PrimaryColumn({ type: "text" })
    state!: string;

    @Column({ name: "redirect_to", type: "text" })
    redirectTo!: string;

    @Column({ name: "expires_at", type: "double precision" })
    expiresAt!: number;
}
