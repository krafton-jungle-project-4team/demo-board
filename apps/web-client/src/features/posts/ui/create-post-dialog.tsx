import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@nmm/ui/components";
import type { CreatePostRequest } from "@nmm/shared";
import { postQueryKeys, useCreatePostMutation } from "../api/post-queries";
import { PostForm } from "./post-form";

type CreatePostDialogProps = {
  trigger: ReactNode;
};

const emptyPost: CreatePostRequest = {
  title: "",
  excerpt: "",
  content: "",
  status: "draft"
};

export function CreatePostDialog({ trigger }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CreatePostRequest>(emptyPost);
  const queryClient = useQueryClient();
  const createMutation = useCreatePostMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: postQueryKeys.listPrefix });
      setOpen(false);
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setValues(emptyPost);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>게시글 작성</DialogTitle>
          <DialogDescription>API 구현이 연결되면 동일한 mutation 흐름으로 저장됩니다.</DialogDescription>
        </DialogHeader>
        <PostForm
          values={values}
          isPending={createMutation.isPending}
          onCancel={() => setOpen(false)}
          onSubmit={() => createMutation.mutate(values)}
          onValuesChange={setValues}
        />
      </DialogContent>
    </Dialog>
  );
}
