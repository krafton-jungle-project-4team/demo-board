import {
    CreatePostResponseSchema,
    DeletePostResponseSchema,
    PostListResponseSchema,
    UpdatePostResponseSchema,
    type CreatePostRequest,
    type CreatePostResponse,
    type DeletePostParams,
    type DeletePostResponse,
    type PostListResponse,
    type UpdatePostParams,
    type UpdatePostRequest,
    type UpdatePostResponse
} from "@nmm/shared";
import { requestApiData } from "@/shared/api/http-client";

export function getPosts(): Promise<PostListResponse> {
    return requestApiData("posts", PostListResponseSchema);
}

export function createPost(request: CreatePostRequest): Promise<CreatePostResponse> {
    return requestApiData("posts", CreatePostResponseSchema, {
        method: "POST",
        json: request
    });
}

export function updatePost(params: UpdatePostParams, request: UpdatePostRequest): Promise<UpdatePostResponse> {
    return requestApiData(`posts/${params.postId}`, UpdatePostResponseSchema, {
        method: "PATCH",
        json: request
    });
}

export function deletePost(params: DeletePostParams): Promise<DeletePostResponse> {
    return requestApiData(`posts/${params.postId}`, DeletePostResponseSchema, {
        method: "DELETE"
    });
}
