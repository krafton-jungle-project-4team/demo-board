import { queryOptions } from "@tanstack/react-query";
import { getPosts } from "./posts-api";

export const postsQueryKeys = {
    all: ["posts"] as const
};

export const postsQueryOptions = queryOptions({
    queryKey: postsQueryKeys.all,
    queryFn: getPosts
});
