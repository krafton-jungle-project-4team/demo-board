import { Link, useNavigate } from "@tanstack/react-router";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left.mjs";
import type { CreatePostResponse, PostTag } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import { useCreatePostMutation, usePostTagsQuery } from "@/features/posts/api/post-queries";
import { PostForm, type PostFormValues } from "@/features/posts/ui/post-form";

const emptyPostFormValues: PostFormValues = {
    title: "",
    excerpt: "",
    content: "",
    tagIds: []
};
const EMPTY_POST_TAGS: PostTag[] = [];

export function PostCreatePage() {
    const navigate = useNavigate();
    const tagsQuery = usePostTagsQuery();
    const availableTags = tagsQuery.data ?? EMPTY_POST_TAGS;
    const createMutation = useCreatePostMutation({
        onSuccess: handleCreatePostSuccess
    });

    function handleCreatePostSuccess(response: CreatePostResponse) {
        void navigate({
            to: "/posts/$postId",
            params: {
                postId: String(response.postId)
            }
        });
    }

    function handleCancel() {
        void navigate({ to: "/posts" });
    }

    function handleSubmit(values: PostFormValues) {
        createMutation.mutate(values);
    }

    return (
        <section className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid gap-3">
                <Button asChild variant="ghost" className="justify-self-start">
                    <Link to="/posts">
                        <ArrowLeft />
                        목록
                    </Link>
                </Button>
                <div className="grid gap-1">
                    <h1 className="text-2xl font-semibold tracking-normal">게시글 작성</h1>
                    <p className="text-sm text-muted-foreground">순수 text 게시글을 작성합니다.</p>
                </div>
            </div>
            <PostForm
                availableTags={availableTags}
                defaultValues={emptyPostFormValues}
                isPending={createMutation.isPending}
                onCancel={handleCancel}
                onSubmit={handleSubmit}
            />
        </section>
    );
}
