import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@nmm/ui/components";
import type { CreatePostRequest, Post, UpdatePostResponse } from "@nmm/shared";
import { useCurrentUserQuery } from "@/features/auth";
import {
    PostForm,
    canManagePost,
    useDeletePostMutation,
    usePostDetailQuery,
    usePostTagsQuery,
    useUpdatePostMutation
} from "@/features/posts";

type PostEditPageProps = {
    postId: string;
};

export function PostEditPage({ postId }: PostEditPageProps) {
    const currentUserQuery = useCurrentUserQuery();
    const post = usePostDetailQuery(postId).data;

    if (currentUserQuery.isPending) {
        return <PostEditPermissionPending />;
    }

    if (!canManagePost(currentUserQuery.data, post)) {
        return <PostEditForbidden postId={post.id} />;
    }

    return <EditablePostEditPage key={post.id} post={post} />;
}

function PostEditPermissionPending() {
    return (
        <section className="mx-auto w-full max-w-3xl px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
            권한 확인 중
        </section>
    );
}

type PostEditForbiddenProps = {
    postId: number | string;
};

function PostEditForbidden({ postId }: PostEditForbiddenProps) {
    return (
        <section className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <Button asChild variant="ghost" className="justify-self-start">
                <Link to="/posts/$postId" params={{ postId: String(postId) }}>
                    <ArrowLeft />
                    상세
                </Link>
            </Button>
            <div className="grid gap-2">
                <h1 className="text-2xl font-semibold tracking-normal">수정 권한이 없습니다.</h1>
                <p className="text-sm text-muted-foreground">작성자만 게시글을 수정하거나 삭제할 수 있습니다.</p>
            </div>
        </section>
    );
}

type EditablePostEditPageProps = {
    post: Post;
};

function EditablePostEditPage({ post }: EditablePostEditPageProps) {
    const navigate = useNavigate();
    const tagsQuery = usePostTagsQuery();
    const initialValues = useMemo<CreatePostRequest>(
        () => ({
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            tagIds: post.tags.map((tag) => tag.id)
        }),
        [post.content, post.excerpt, post.tags, post.title]
    );
    const [values, setValues] = useState<CreatePostRequest>(initialValues);
    const updateMutation = useUpdatePostMutation({
        onSuccess: handleUpdatePostSuccess
    });
    const deleteMutation = useDeletePostMutation({
        onSuccess: handleDeletePostSuccess
    });

    function handleUpdatePostSuccess(response: UpdatePostResponse) {
        void navigate({
            to: "/posts/$postId",
            params: {
                postId: String(response.postId)
            }
        });
    }

    function handleDeletePostSuccess() {
        void navigate({ to: "/posts" });
    }

    function handleDeleteClick() {
        deleteMutation.mutate(post.id);
    }

    function handleCancel() {
        void navigate({
            to: "/posts/$postId",
            params: {
                postId: String(post.id)
            }
        });
    }

    function handleSubmit() {
        const request: CreatePostRequest = values;

        updateMutation.mutate({
            id: post.id,
            data: request
        });
    }

    return (
        <section className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                    <Button asChild variant="ghost">
                        <Link to="/posts/$postId" params={{ postId: String(post.id) }}>
                            <ArrowLeft />
                            상세
                        </Link>
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={deleteMutation.isPending || updateMutation.isPending}
                        onClick={handleDeleteClick}
                    >
                        <Trash2 />
                        삭제
                    </Button>
                </div>
                <div className="grid gap-1">
                    <h1 className="text-2xl font-semibold tracking-normal">게시글 수정</h1>
                    <p className="text-sm text-muted-foreground">제목, 요약, 본문을 수정합니다.</p>
                </div>
            </div>
            <PostForm
                availableTags={tagsQuery.data ?? []}
                values={values}
                isPending={updateMutation.isPending}
                onCancel={handleCancel}
                onSubmit={handleSubmit}
                onValuesChange={setValues}
            />
        </section>
    );
}
