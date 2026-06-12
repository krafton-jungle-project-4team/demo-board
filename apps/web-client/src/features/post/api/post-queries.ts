import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { addPostTag, createTag, getPostTags, getTags } from "./post-api";

type AddPostTagMutationVariables = {
    postId: number;
    tagId: number;
};

export const postQueryKeys = {
    tags: ["tags"] as const,
    postTags: (postId: number) => ["posts", postId, "tags"] as const
};

export const tagsQueryOptions = queryOptions({
    queryKey: postQueryKeys.tags,
    queryFn: getTags
});

export function postTagsQueryOptions(postId: number) {
    return queryOptions({
        queryKey: postQueryKeys.postTags(postId),
        queryFn: () => getPostTags(postId)
    });
}

export const createTagMutationOptions = mutationOptions({
    mutationFn: createTag
});

export const addPostTagMutationOptions = mutationOptions({
    mutationFn: addPostTagByVariables
});

function addPostTagByVariables(variables: AddPostTagMutationVariables) {
    return addPostTag(variables.postId, {
        tagId: variables.tagId
    });
}
