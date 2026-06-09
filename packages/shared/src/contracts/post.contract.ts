import { z } from "zod";

export const PostSortSchema = z.enum(["created-desc", "created-asc", "title-asc"]);
export type PostSort = z.infer<typeof PostSortSchema>;

export const PostViewSchema = z.enum(["table", "card"]);
export type PostView = z.infer<typeof PostViewSchema>;

export const ResourceIdSchema = z.coerce.number().int().positive();
export type ResourceId = z.infer<typeof ResourceIdSchema>;

export const PostTagSchema = z.object({
    id: ResourceIdSchema,
    name: z.string().min(1)
});

export type PostTag = z.infer<typeof PostTagSchema>;

export const PostSchema = z.object({
    id: ResourceIdSchema,
    title: z.string().min(1),
    excerpt: z.string().min(1),
    content: z.string().min(1),
    authorId: z.string(),
    authorName: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    tags: z.array(PostTagSchema)
});

export type Post = z.infer<typeof PostSchema>;

export const ListPostsQuerySchema = z.object({
    q: z.string().default(""),
    tagId: ResourceIdSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    sort: PostSortSchema.default("created-desc"),
    view: PostViewSchema.default("table")
});

export type ListPostsQuery = z.infer<typeof ListPostsQuerySchema>;

export const PostListResponseSchema = z.object({
    items: z.array(PostSchema),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(1)
});

export type PostListResponse = z.infer<typeof PostListResponseSchema>;

export const CreatePostRequestSchema = z.object({
    title: z.string().min(1),
    excerpt: z.string().min(1),
    content: z.string().min(1),
    tagIds: z.array(ResourceIdSchema).default([])
});

export type CreatePostRequest = z.infer<typeof CreatePostRequestSchema>;

export const UpdatePostRequestSchema = CreatePostRequestSchema.partial();
export type UpdatePostRequest = z.infer<typeof UpdatePostRequestSchema>;

export const DeletePostResponseSchema = z.object({
    ok: z.boolean(),
    id: ResourceIdSchema
});

export type DeletePostResponse = z.infer<typeof DeletePostResponseSchema>;

export const CommentSchema = z.object({
    id: ResourceIdSchema,
    postId: ResourceIdSchema,
    content: z.string().min(1),
    authorId: z.string(),
    authorName: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});

export type Comment = z.infer<typeof CommentSchema>;

export const CommentListResponseSchema = z.object({
    items: z.array(CommentSchema)
});

export type CommentListResponse = z.infer<typeof CommentListResponseSchema>;

export const CreateCommentRequestSchema = z.object({
    content: z.string().min(1)
});

export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>;

export const UpdateCommentRequestSchema = CreateCommentRequestSchema.partial();
export type UpdateCommentRequest = z.infer<typeof UpdateCommentRequestSchema>;

export const DeleteCommentResponseSchema = z.object({
    ok: z.boolean(),
    id: ResourceIdSchema
});

export type DeleteCommentResponse = z.infer<typeof DeleteCommentResponseSchema>;
