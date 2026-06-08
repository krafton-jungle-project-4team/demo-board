import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
  postsControllerCreatePost,
  postsControllerDeletePost,
  postsControllerFindPost,
  postsControllerFindPosts,
  postsControllerUpdatePost,
  type CreatePostDto,
  type PostsControllerFindPostsParams,
  type UpdatePostDto
} from "@/shared/api/generated/api-server";

export const postQueryKeys = {
  listPrefix: ["posts", "list"] as const,
  list: (params: PostsControllerFindPostsParams) => [...postQueryKeys.listPrefix, params] as const,
  detail: (id: string) => ["posts", "detail", id] as const
};

export function usePostListQuery(params: PostsControllerFindPostsParams) {
  return useSuspenseQuery({
    queryKey: postQueryKeys.list(params),
    queryFn: ({ signal }) => postsControllerFindPosts(params, { signal })
  });
}

export function usePostDetailQuery(id: string) {
  return useSuspenseQuery({
    queryKey: postQueryKeys.detail(id),
    queryFn: ({ signal }) => postsControllerFindPost(id, { signal })
  });
}

export function useCreatePostMutation(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (data: CreatePostDto) => postsControllerCreatePost(data),
    onSuccess: options?.onSuccess
  });
}

export function useUpdatePostMutation(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostDto }) => postsControllerUpdatePost(id, data),
    onSuccess: options?.onSuccess
  });
}

export function useDeletePostMutation(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (id: string) => postsControllerDeletePost(id),
    onSuccess: options?.onSuccess
  });
}
