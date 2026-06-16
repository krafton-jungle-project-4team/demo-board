import { z } from "zod";
import {
    NullableSongpaBoardDongCodeSchema,
    NullableSongpaBoardDongNameSchema,
    SongpaBoardDongCodeSchema
} from "./songpa-dong.contract";

export const AuthUserSchema = z.object({
    id: z.number().int().positive(),
    authUserId: z.string().min(1),
    email: z.string().email(),
    name: z.string().min(1),
    residenceDongCode: NullableSongpaBoardDongCodeSchema,
    residenceDongName: NullableSongpaBoardDongNameSchema
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

export const CurrentUserResponseSchema = AuthUserSchema;

export type CurrentUserResponse = z.infer<typeof CurrentUserResponseSchema>;

export const UpdateResidenceDongRequestSchema = z.object({
    residenceDongCode: SongpaBoardDongCodeSchema
});

export type UpdateResidenceDongRequest = z.infer<typeof UpdateResidenceDongRequestSchema>;
