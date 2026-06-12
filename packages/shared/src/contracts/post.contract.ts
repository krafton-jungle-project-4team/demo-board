import { z } from "zod";

const PostIdSchema = z.number().int().positive();

export const PostSchema = z.object({
    id: PostIdSchema,
    title: z.string().min(1),
    content: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});

export type Post = z.infer<typeof PostSchema>;

export const PostListResponseSchema = z.object({
    posts: z.array(PostSchema)
});

export type PostListResponse = z.infer<typeof PostListResponseSchema>;

export const PostDetailResponseSchema = PostSchema;

export type PostDetailResponse = z.infer<typeof PostDetailResponseSchema>;

export const CreatePostRequestSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1)
});

export type CreatePostRequest = z.infer<typeof CreatePostRequestSchema>;

export const CreatePostResponseSchema = z.object({
    id: PostIdSchema
});

export type CreatePostResponse = z.infer<typeof CreatePostResponseSchema>;

export const UpdatePostParamsSchema = z.object({
    postId: PostIdSchema
});

export type UpdatePostParams = z.infer<typeof UpdatePostParamsSchema>;

export const UpdatePostRequestSchema = z
    .object({
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional()
    })
    .refine((request) => request.title !== undefined || request.content !== undefined, {
        message: "At least one post field is required."
    });

export type UpdatePostRequest = z.infer<typeof UpdatePostRequestSchema>;

export const UpdatePostResponseSchema = z.object({
    id: PostIdSchema
});

export type UpdatePostResponse = z.infer<typeof UpdatePostResponseSchema>;

export const DeletePostParamsSchema = z.object({
    postId: PostIdSchema
});

export type DeletePostParams = z.infer<typeof DeletePostParamsSchema>;

export const DeletePostResponseSchema = z.object({
    id: PostIdSchema
});

export type DeletePostResponse = z.infer<typeof DeletePostResponseSchema>;
