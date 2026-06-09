import { ApiProperty } from "@nestjs/swagger";
import type { UserRole, UserStatus } from "@nmm/shared";

export const userRoleValues = ["USER", "ADMIN"] as const satisfies readonly UserRole[];
export const userStatusValues = ["PENDING", "ACTIVE", "SUSPENDED"] as const satisfies readonly UserStatus[];

export class CompleteSignUpDto {
  @ApiProperty({ type: String, example: "sijun" })
  name!: string;
}

export class UpdateCurrentUserDto {
  @ApiProperty({ type: String, example: "sijun" })
  name!: string;
}

export class UserDto {
  @ApiProperty({ type: String, example: "user-1" })
  id!: string;

  @ApiProperty({ type: String, example: "sijun@example.com" })
  email!: string;

  @ApiProperty({ type: String, nullable: true, example: "sijun" })
  name!: string | null;

  @ApiProperty({ type: String, nullable: true, example: "https://avatars.githubusercontent.com/u/1?v=4" })
  image!: string | null;

  @ApiProperty({ enum: userRoleValues, example: "USER" })
  role!: UserRole;

  @ApiProperty({ enum: userStatusValues, example: "ACTIVE" })
  status!: UserStatus;

  @ApiProperty({ type: String, example: "2026-06-09T00:00:00.000Z" })
  createdAt!: string;
}
