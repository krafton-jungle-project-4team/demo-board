import { z } from "zod";

export const PostTagIdSchema = z.number().int().positive();
export const PostTagNameSchema = z.string().trim().min(1).max(30);

export const PostTagResponseSchema = z.object({
    id: PostTagIdSchema,
    name: PostTagNameSchema
});

export type PostTagResponse = z.infer<typeof PostTagResponseSchema>;

export const PostTagListResponseSchema = z.array(PostTagResponseSchema);

export type PostTagListResponse = z.infer<typeof PostTagListResponseSchema>;

export const CreatePostTagRequestSchema = z.object({
    name: PostTagNameSchema
});

export type CreatePostTagRequest = z.infer<typeof CreatePostTagRequestSchema>;

export const CreatePostTagResponseSchema = z.object({
    id: PostTagIdSchema
});

export type CreatePostTagResponse = z.infer<typeof CreatePostTagResponseSchema>;

export const PostIdParamsSchema = z.object({
    postId: z.coerce.number().int().positive()
});

export type PostIdParams = z.infer<typeof PostIdParamsSchema>;

export const AddPostTagRequestSchema = z.object({
    postTagId: PostTagIdSchema
});

export type AddPostTagRequest = z.infer<typeof AddPostTagRequestSchema>;

export const AddPostTagResponseSchema = z.object({
    id: z.number().int().positive(),
    postId: z.number().int().positive(),
    postTagId: PostTagIdSchema
});

export type AddPostTagResponse = z.infer<typeof AddPostTagResponseSchema>;
