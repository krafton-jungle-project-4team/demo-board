import {
    AddPostTagResponseSchema,
    CreateTagResponseSchema,
    TagListResponseSchema,
    type AddPostTagRequest,
    type AddPostTagResponse,
    type CreateTagRequest,
    type CreateTagResponse,
    type TagResponse
} from "@nmm/shared";
import { requestApiData } from "@/shared/api/http-client";

export function getTags(): Promise<TagResponse[]> {
    return requestApiData("tags", TagListResponseSchema);
}

export function createTag(request: CreateTagRequest): Promise<CreateTagResponse> {
    return requestApiData("tags", CreateTagResponseSchema, {
        method: "post",
        json: request
    });
}

export function getPostTags(postId: number): Promise<TagResponse[]> {
    return requestApiData(`posts/${postId}/tags`, TagListResponseSchema);
}

export function addPostTag(postId: number, request: AddPostTagRequest): Promise<AddPostTagResponse> {
    return requestApiData(`posts/${postId}/tags`, AddPostTagResponseSchema, {
        method: "post",
        json: request
    });
}
