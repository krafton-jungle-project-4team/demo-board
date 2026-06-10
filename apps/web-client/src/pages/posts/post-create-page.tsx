import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@nmm/ui/components";
import type { CreatePostRequest, CreatePostResponse } from "@nmm/shared";
import { PostForm, postQueryKeys, useCreatePostMutation } from "@/features/posts";
import { useState } from "react";

const emptyPost: CreatePostRequest = {
    title: "",
    excerpt: "",
    content: "",
    tagIds: []
};

export function PostCreatePage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [values, setValues] = useState<CreatePostRequest>(emptyPost);
    const createMutation = useCreatePostMutation({
        onSuccess: handleCreatePostSuccess
    });

    function handleCreatePostSuccess(response: CreatePostResponse) {
        void queryClient.invalidateQueries({ queryKey: postQueryKeys.listPrefix });
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

    function handleSubmit() {
        const request: CreatePostRequest = values;

        createMutation.mutate(request);
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
                values={values}
                isPending={createMutation.isPending}
                onCancel={handleCancel}
                onSubmit={handleSubmit}
                onValuesChange={setValues}
            />
        </section>
    );
}
