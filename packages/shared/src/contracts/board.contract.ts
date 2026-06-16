import { z } from "zod";
import {
    NullableSongpaBoardDongCodeSchema,
    NullableSongpaBoardDongNameSchema,
    SongpaBoardDongCodeSchema,
    SongpaBoardDongNameSchema
} from "./songpa-dong.contract";

const DEFAULT_BOARD_POST_LIST_PAGE = 1;
const DEFAULT_BOARD_POST_LIST_PAGE_SIZE = 10;
const MAX_BOARD_POST_LIST_PAGE_SIZE = 50;
const MAX_BOARD_POST_TAG_COUNT = 10;

export const BOARD_POST_SEARCH_SCOPES = ["title", "content", "tag", "titleContent"] as const;
export const DEFAULT_BOARD_POST_SEARCH_SCOPE = "titleContent";

export const BoardIdSchema = z.number().int().positive();

export const BoardAuthorSchema = z.object({
    id: BoardIdSchema,
    name: z.string().min(1),
    email: z.string().email(),
    residenceDongCode: NullableSongpaBoardDongCodeSchema,
    residenceDongName: NullableSongpaBoardDongNameSchema
});

export type BoardAuthor = z.infer<typeof BoardAuthorSchema>;

export const BoardTagNameSchema = z.string().trim().min(1).max(30);

export const BoardTagResponseSchema = z.object({
    id: BoardIdSchema,
    name: BoardTagNameSchema
});

export type BoardTagResponse = z.infer<typeof BoardTagResponseSchema>;

export const BoardTagListResponseSchema = z.array(BoardTagResponseSchema);

export type BoardTagListResponse = z.infer<typeof BoardTagListResponseSchema>;

const BoardPostTagsSchema = z.array(BoardTagNameSchema).max(MAX_BOARD_POST_TAG_COUNT).default([]);

export const BoardPostSearchScopeSchema = z.enum(BOARD_POST_SEARCH_SCOPES).default(DEFAULT_BOARD_POST_SEARCH_SCOPE);

export type BoardPostSearchScope = z.infer<typeof BoardPostSearchScopeSchema>;

const OptionalBoardSearchKeywordSchema = z.preprocess((value) => {
    if (typeof value !== "string" && typeof value !== "number") {
        return undefined;
    }

    const keyword = String(value).trim();

    return keyword.length > 0 ? keyword : undefined;
}, z.string().min(1).max(100).optional());

const OptionalBoardDongCodeSchema = z.preprocess((value) => {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (typeof value !== "string" && typeof value !== "number") {
        return value;
    }

    const dongCode = String(value)
        .trim()
        .replace(/^"(.+)"$/, "$1");

    return dongCode.length > 0 ? dongCode : undefined;
}, SongpaBoardDongCodeSchema.optional());

export const BoardPostListQuerySchema = z.object({
    dongCode: OptionalBoardDongCodeSchema,
    page: z.coerce.number().int().min(1).default(DEFAULT_BOARD_POST_LIST_PAGE),
    pageSize: z.coerce
        .number()
        .int()
        .min(1)
        .max(MAX_BOARD_POST_LIST_PAGE_SIZE)
        .default(DEFAULT_BOARD_POST_LIST_PAGE_SIZE),
    searchScope: BoardPostSearchScopeSchema,
    q: OptionalBoardSearchKeywordSchema
});

export type BoardPostListQuery = z.infer<typeof BoardPostListQuerySchema>;

export const DEFAULT_BOARD_POST_LIST_QUERY = BoardPostListQuerySchema.parse({});

export const BoardPostParamsSchema = z.object({
    postId: z.coerce.number().int().positive()
});

export type BoardPostParams = z.infer<typeof BoardPostParamsSchema>;

export const BoardCommentParamsSchema = z.object({
    commentId: z.coerce.number().int().positive()
});

export type BoardCommentParams = z.infer<typeof BoardCommentParamsSchema>;

export const BoardPostListItemSchema = z.object({
    id: BoardIdSchema,
    dongCode: SongpaBoardDongCodeSchema.nullable(),
    dongName: SongpaBoardDongNameSchema.nullable(),
    title: z.string().min(1),
    excerpt: z.string(),
    tags: BoardTagListResponseSchema,
    author: BoardAuthorSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});

export type BoardPostListItem = z.infer<typeof BoardPostListItemSchema>;

export const BoardPostListResponseSchema = z.object({
    items: z.array(BoardPostListItemSchema),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(MAX_BOARD_POST_LIST_PAGE_SIZE),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasPreviousPage: z.boolean(),
    hasNextPage: z.boolean()
});

export type BoardPostListResponse = z.infer<typeof BoardPostListResponseSchema>;

export const BoardPostDetailResponseSchema = z.object({
    id: BoardIdSchema,
    dongCode: SongpaBoardDongCodeSchema.nullable(),
    dongName: SongpaBoardDongNameSchema.nullable(),
    title: z.string().min(1),
    content: z.string().min(1),
    tags: BoardTagListResponseSchema,
    author: BoardAuthorSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});

export type BoardPostDetailResponse = z.infer<typeof BoardPostDetailResponseSchema>;

export const BoardPostUpdateRequestSchema = z.object({
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(20000),
    tags: BoardPostTagsSchema
});

export type BoardPostUpdateRequest = z.infer<typeof BoardPostUpdateRequestSchema>;

export const BoardPostCreateRequestSchema = BoardPostUpdateRequestSchema;

export type BoardPostCreateRequest = z.infer<typeof BoardPostCreateRequestSchema>;

export const BoardPostWriteRequestSchema = BoardPostUpdateRequestSchema;

export type BoardPostWriteRequest = BoardPostUpdateRequest;

export const BoardCommandResponseSchema = z.object({
    id: BoardIdSchema
});

export type BoardCommandResponse = z.infer<typeof BoardCommandResponseSchema>;

export const BoardCommentWriteRequestSchema = z.object({
    content: z.string().trim().min(1).max(300)
});

export type BoardCommentWriteRequest = z.infer<typeof BoardCommentWriteRequestSchema>;

export const BoardCommentListQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(50).default(20)
});

export type BoardCommentListQuery = z.infer<typeof BoardCommentListQuerySchema>;

export const BoardCommentReplyResponseSchema = z.object({
    id: BoardIdSchema,
    postId: BoardIdSchema,
    parentCommentId: BoardIdSchema,
    author: BoardAuthorSchema,
    content: z.string().min(1),
    depth: z.literal(1),
    isDeleted: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});

export type BoardCommentReplyResponse = z.infer<typeof BoardCommentReplyResponseSchema>;

export const BoardCommentResponseSchema = z.object({
    id: BoardIdSchema,
    postId: BoardIdSchema,
    parentCommentId: z.null(),
    author: BoardAuthorSchema,
    content: z.string().min(1),
    depth: z.literal(0),
    isDeleted: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    replies: z.array(BoardCommentReplyResponseSchema)
});

export type BoardCommentResponse = z.infer<typeof BoardCommentResponseSchema>;

export const BoardCommentPageInfoSchema = z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalCount: z.number().int().min(0),
    totalPages: z.number().int().min(0)
});

export type BoardCommentPageInfo = z.infer<typeof BoardCommentPageInfoSchema>;

export const BoardCommentListResponseSchema = z.object({
    items: z.array(BoardCommentResponseSchema),
    pageInfo: BoardCommentPageInfoSchema
});

export type BoardCommentListResponse = z.infer<typeof BoardCommentListResponseSchema>;
