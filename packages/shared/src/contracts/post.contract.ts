import { z } from "zod";

export const TagIdSchema = z.number().int().positive();
export const TagNameSchema = z.string().trim().min(1).max(30);

export const TagResponseSchema = z.object({
    id: TagIdSchema,
    name: TagNameSchema
});

export type TagResponse = z.infer<typeof TagResponseSchema>;

export const TagListResponseSchema = z.array(TagResponseSchema);

export type TagListResponse = z.infer<typeof TagListResponseSchema>;

export const CreateTagRequestSchema = z.object({
    name: TagNameSchema
});

export type CreateTagRequest = z.infer<typeof CreateTagRequestSchema>;

export const CreateTagResponseSchema = z.object({
    id: TagIdSchema
});

export type CreateTagResponse = z.infer<typeof CreateTagResponseSchema>;

export const PostIdParamsSchema = z.object({
    postId: z.coerce.number().int().positive()
});

export type PostIdParams = z.infer<typeof PostIdParamsSchema>;

export const AddPostTagRequestSchema = z.object({
    tagId: TagIdSchema
});

export type AddPostTagRequest = z.infer<typeof AddPostTagRequestSchema>;

export const AddPostTagResponseSchema = z.object({
    id: z.number().int().positive(),
    postId: z.number().int().positive(),
    tagId: TagIdSchema
});

export type AddPostTagResponse = z.infer<typeof AddPostTagResponseSchema>;
