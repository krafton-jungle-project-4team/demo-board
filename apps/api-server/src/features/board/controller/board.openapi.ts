import {
    CommentListResponseSchema,
    CommentSchema,
    CreateCommentRequestSchema,
    CreatePostRequestSchema,
    DeleteCommentResponseSchema,
    DeletePostResponseSchema,
    PostListResponseSchema,
    PostSchema,
    PostSortSchema,
    PostTagSchema,
    PostViewSchema,
    UpdateCommentRequestSchema,
    UpdatePostRequestSchema
} from "@nmm/shared";
import { apiSuccessSchema, zodToOpenApiSchema, type OpenApiSchema } from "../../../common/http";

export const postSortValues = PostSortSchema.options;
export const postViewValues = PostViewSchema.options;

export const postTagListApiResponseOpenApiSchema = apiSuccessSchema({
    type: "array",
    items: zodToOpenApiSchema(PostTagSchema)
} satisfies OpenApiSchema);
export const postApiResponseOpenApiSchema = apiSuccessSchema(zodToOpenApiSchema(PostSchema));
export const postListApiResponseOpenApiSchema = apiSuccessSchema(zodToOpenApiSchema(PostListResponseSchema));
export const createPostRequestOpenApiSchema = zodToOpenApiSchema(CreatePostRequestSchema, { io: "input" });
export const updatePostRequestOpenApiSchema = zodToOpenApiSchema(UpdatePostRequestSchema, { io: "input" });
export const deletePostApiResponseOpenApiSchema = apiSuccessSchema(zodToOpenApiSchema(DeletePostResponseSchema));
export const commentApiResponseOpenApiSchema = apiSuccessSchema(zodToOpenApiSchema(CommentSchema));
export const commentListApiResponseOpenApiSchema = apiSuccessSchema(zodToOpenApiSchema(CommentListResponseSchema));
export const createCommentRequestOpenApiSchema = zodToOpenApiSchema(CreateCommentRequestSchema, { io: "input" });
export const updateCommentRequestOpenApiSchema = zodToOpenApiSchema(UpdateCommentRequestSchema, { io: "input" });
export const deleteCommentApiResponseOpenApiSchema = apiSuccessSchema(zodToOpenApiSchema(DeleteCommentResponseSchema));
