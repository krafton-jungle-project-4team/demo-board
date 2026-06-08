import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@nmm/ui/components";
import {
  PostStatusBadge,
  UpdatePostDialog,
  postQueryKeys,
  useDeletePostMutation,
  usePostDetailQuery
} from "@/features/posts";

type PostDetailPageProps = {
  postId: string;
};

export function PostDetailPage({ postId }: PostDetailPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const post = usePostDetailQuery(postId).data;
  const deleteMutation = useDeletePostMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: postQueryKeys.listPrefix });
      void navigate({ to: "/posts" });
    }
  });

  return (
    <article className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link to="/posts">
            <ArrowLeft />
            목록
          </Link>
        </Button>
        <div className="flex gap-1">
          <UpdatePostDialog
            post={post}
            trigger={
              <Button type="button" variant="outline">
                <Pencil />
                수정
              </Button>
            }
          />
          <Button
            type="button"
            variant="outline"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(post.id)}
          >
            <Trash2 />
            삭제
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center gap-2">
          <PostStatusBadge status={post.status} />
          <span className="text-muted-foreground text-sm">{post.authorName}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-normal">{post.title}</h1>
        <p className="text-muted-foreground">{post.excerpt}</p>
      </div>

      <div className="border-t pt-6">
        <p className="whitespace-pre-wrap text-sm leading-7">{post.content}</p>
      </div>
    </article>
  );
}
