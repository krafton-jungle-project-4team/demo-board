import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { addPostTag, createPostTag, getPostTags, getPostTagsByPostId } from "./post-api";

type AddPostTagMutationVariables = {
    postId: number;
    postTagId: number;
};

export const postQueryKeys = {
    postTags: ["posts", "tags"] as const,
    postTagsByPostId: (postId: number) => ["posts", postId, "tags"] as const
};

export const postTagsQueryOptions = queryOptions({
    queryKey: postQueryKeys.postTags,
    queryFn: getPostTags
});

export function postTagsByPostIdQueryOptions(postId: number) {
    return queryOptions({
        queryKey: postQueryKeys.postTagsByPostId(postId),
        queryFn: () => getPostTagsByPostId(postId)
    });
}

export const createPostTagMutationOptions = mutationOptions({
    mutationFn: createPostTag
});

export const addPostTagMutationOptions = mutationOptions({
    mutationFn: addPostTagByVariables
});

function addPostTagByVariables(variables: AddPostTagMutationVariables) {
    return addPostTag(variables.postId, {
        postTagId: variables.postTagId
    });
}
