import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("oauth_accounts")
export class OAuthAccountEntity {
  @PrimaryColumn({ name: "account_key", type: "text" })
  accountKey!: string;

  @Column({ type: "text" })
  provider!: "github";

  @Column({ name: "provider_account_id", type: "text" })
  providerAccountId!: string;

  @Column({ name: "user_id", type: "text" })
  userId!: string;

  @Column({ name: "access_token", type: "text" })
  accessToken!: string;

  @Column({ name: "provider_login", type: "text" })
  providerLogin!: string;

  @Column({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
