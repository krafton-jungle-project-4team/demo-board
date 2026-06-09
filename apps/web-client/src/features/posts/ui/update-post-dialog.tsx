import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@nmm/ui/components";
import type { CreatePostRequest } from "@nmm/shared";
import type { PostDto } from "@/shared/api/generated/api-server";
import { postQueryKeys, useUpdatePostMutation } from "../api/post-queries";
import { PostForm } from "./post-form";

type UpdatePostDialogProps = {
  post: PostDto;
  trigger: ReactNode;
};

export function UpdatePostDialog({ post, trigger }: UpdatePostDialogProps) {
  const postValues: CreatePostRequest = {
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    status: post.status,
    tagIds: post.tags.map((tag) => tag.id)
  };
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CreatePostRequest>(postValues);
  const queryClient = useQueryClient();
  const updateMutation = useUpdatePostMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: postQueryKeys.listPrefix });
      void queryClient.invalidateQueries({ queryKey: postQueryKeys.detail(post.id) });
      setOpen(false);
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setValues(postValues);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>게시글 수정</DialogTitle>
          <DialogDescription>API 구현이 연결되면 동일한 mutation 흐름으로 저장됩니다.</DialogDescription>
        </DialogHeader>
        <PostForm
          values={values}
          isPending={updateMutation.isPending}
          onCancel={() => setOpen(false)}
          onSubmit={() =>
            updateMutation.mutate({
              id: post.id,
              data: values
            })
          }
          onValuesChange={setValues}
        />
      </DialogContent>
    </Dialog>
  );
}
