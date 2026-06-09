import { z } from "zod";

export const UserRoleSchema = z.enum(["USER", "ADMIN"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(["PENDING", "ACTIVE", "SUSPENDED"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const UserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().min(1).nullable(),
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

export const UpdateCurrentUserRequestSchema = z.object({
    name: z.string().trim().min(1)
});

export type UpdateCurrentUserRequest = z.infer<typeof UpdateCurrentUserRequestSchema>;

export const LogoutResponseSchema = z.object({
    ok: z.boolean()
});

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
