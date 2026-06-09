import { Column, Entity, PrimaryColumn } from "typeorm";
import type { UserRole, UserStatus } from "@nmm/shared";

@Entity("users")
export class UserEntity {
  @PrimaryColumn({ type: "text" })
  id!: string;

  @Column({ type: "text", unique: true })
  email!: string;

  @Column({ type: "text", nullable: true })
  name!: string | null;

  @Column({ type: "text", nullable: true })
  image!: string | null;

  @Column({ type: "text" })
  role!: UserRole;

  @Column({ type: "text" })
  status!: UserStatus;

  @Column({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
