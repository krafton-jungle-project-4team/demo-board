import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("sessions")
export class SessionEntity {
  @PrimaryColumn({ type: "text" })
  token!: string;

  @Column({ name: "user_id", type: "text" })
  userId!: string;
}
