import { z } from "zod";

export const UserRoleSchema = z.enum(["USER", "ADMIN"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(["PENDING", "ACTIVE", "SUSPENDED"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  image: z.string().url().nullable(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  createdAt: z.string().datetime()
});

export type User = z.infer<typeof UserSchema>;

export const CompleteSignUpRequestSchema = z.object({
  name: z.string().trim().min(1)
});

export type CompleteSignUpRequest = z.infer<typeof CompleteSignUpRequestSchema>;
