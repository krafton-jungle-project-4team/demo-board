import {
    AddPostTagResponseSchema,
    CreatePostTagResponseSchema,
    PostTagListResponseSchema,
    type AddPostTagRequest,
    type AddPostTagResponse,
    type CreatePostTagRequest,
    type CreatePostTagResponse,
    type PostTagResponse
} from "@nmm/shared";
import { requestApiData } from "@/shared/api/http-client";

export function getPostTags(): Promise<PostTagResponse[]> {
    return requestApiData("posts/tags", PostTagListResponseSchema);
}

export function createPostTag(request: CreatePostTagRequest): Promise<CreatePostTagResponse> {
    return requestApiData("posts/tags", CreatePostTagResponseSchema, {
        method: "post",
        json: request
    });
}

export function getPostTagsByPostId(postId: number): Promise<PostTagResponse[]> {
    return requestApiData(`posts/${postId}/tags`, PostTagListResponseSchema);
}

export function addPostTag(postId: number, request: AddPostTagRequest): Promise<AddPostTagResponse> {
    return requestApiData(`posts/${postId}/tags`, AddPostTagResponseSchema, {
        method: "post",
        json: request
    });
}
