import { z } from "zod";

export const PostSortSchema = z.enum(["created-desc", "created-asc", "title-asc"]);
export type PostSort = z.infer<typeof PostSortSchema>;

export const PostViewSchema = z.enum(["table", "card"]);
export type PostView = z.infer<typeof PostViewSchema>;

export const PostStatusSchema = z.enum(["draft", "published"]);
export type PostStatus = z.infer<typeof PostStatusSchema>;

export const PostSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  authorName: z.string().min(1),
  createdAt: z.string().datetime(),
  status: PostStatusSchema
});

export type Post = z.infer<typeof PostSchema>;

export const ListPostsQuerySchema = z.object({
  q: z.string().default(""),
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
  status: PostStatusSchema.default("draft")
});

export type CreatePostRequest = z.infer<typeof CreatePostRequestSchema>;

export const UpdatePostRequestSchema = CreatePostRequestSchema.partial();
export type UpdatePostRequest = z.infer<typeof UpdatePostRequestSchema>;

export const DeletePostResponseSchema = z.object({
  ok: z.boolean(),
  id: z.string()
});

export type DeletePostResponse = z.infer<typeof DeletePostResponseSchema>;
