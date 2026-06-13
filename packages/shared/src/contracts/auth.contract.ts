import { z } from "zod";

export const AuthUserSchema = z.object({
    id: z.number().int().positive(),
    authUserId: z.string().min(1),
    email: z.string().email(),
    name: z.string().min(1)
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

export const CurrentUserResponseSchema = AuthUserSchema;

export type CurrentUserResponse = z.infer<typeof CurrentUserResponseSchema>;
