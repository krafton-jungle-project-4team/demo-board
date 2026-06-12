import { z } from "zod";

const DEFAULT_POST_LIST_PAGE = 1;
const DEFAULT_POST_LIST_PAGE_SIZE = 10;
const MAX_POST_LIST_PAGE_SIZE = 50;

const OptionalSearchKeywordSchema = z.preprocess((value) => {
    if (typeof value !== "string") {
        return undefined;
    }

    const keyword = value.trim();

    return keyword.length > 0 ? keyword : undefined;
}, z.string().min(1).max(100).optional());

export const PostListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(DEFAULT_POST_LIST_PAGE),
    pageSize: z.coerce.number().int().min(1).max(MAX_POST_LIST_PAGE_SIZE).default(DEFAULT_POST_LIST_PAGE_SIZE),
    q: OptionalSearchKeywordSchema
});

export type PostListQuery = z.infer<typeof PostListQuerySchema>;

export const PostListItemSchema = z.object({
    id: z.number().int().positive(),
    title: z.string().min(1),
    excerpt: z.string(),
    tags: z.array(z.string().min(1)),
    createdAt: z.string().datetime()
});

export type PostListItem = z.infer<typeof PostListItemSchema>;

export const PostListResponseSchema = z.object({
    items: z.array(PostListItemSchema),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(MAX_POST_LIST_PAGE_SIZE),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasPreviousPage: z.boolean(),
    hasNextPage: z.boolean()
});

export type PostListResponse = z.infer<typeof PostListResponseSchema>;
