import { useSuspenseQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { type MouseEvent, useState } from "react";
import type { Post } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@nmm/ui/components/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@nmm/ui/components/dialog";
import { toast } from "@nmm/ui/components/sonner";
import { Spinner } from "@nmm/ui/components/spinner";
import {
    PostForm,
    PostsTable,
    postsQueryOptions,
    useCreatePostMutation,
    useDeletePostMutation,
    useUpdatePostMutation,
    type PostFormValues
} from "@/features/posts";
import { ApiClientError } from "@/shared/api/http-client";

export function PostsPage() {
    const postsQuery = useSuspenseQuery(postsQueryOptions);
    const createPostMutation = useCreatePostMutation();
    const updatePostMutation = useUpdatePostMutation();
    const deletePostMutation = useDeletePostMutation();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [deleteTargetPost, setDeleteTargetPost] = useState<Post | null>(null);

    const posts = postsQuery.data.posts;
    const deletingPostId = deletePostMutation.isPending ? deleteTargetPost?.id : undefined;
    const createErrorMessage = getMutationErrorMessage(createPostMutation.error);
    const updateErrorMessage = getMutationErrorMessage(updatePostMutation.error);
    const deleteErrorMessage = getMutationErrorMessage(deletePostMutation.error);
    const editingPostValues = editingPost
        ? {
              title: editingPost.title,
              content: editingPost.content
          }
        : undefined;

    function handleOpenCreateDialog() {
        createPostMutation.reset();
        setCreateDialogOpen(true);
    }

    function handleCreateDialogOpenChange(isOpen: boolean) {
        setCreateDialogOpen(isOpen);

        if (!isOpen) {
            createPostMutation.reset();
        }
    }

    function handleEditDialogOpenChange(isOpen: boolean) {
        if (!isOpen) {
            updatePostMutation.reset();
            setEditingPost(null);
        }
    }

    function handleDeleteDialogOpenChange(isOpen: boolean) {
        if (!isOpen) {
            deletePostMutation.reset();
            setDeleteTargetPost(null);
        }
    }

    function handleEditPost(post: Post) {
        updatePostMutation.reset();
        setEditingPost(post);
    }

    function handleDeletePost(post: Post) {
        deletePostMutation.reset();
        setDeleteTargetPost(post);
    }

    async function handleCreatePost(values: PostFormValues) {
        try {
            await createPostMutation.mutateAsync(values);
            setCreateDialogOpen(false);
            createPostMutation.reset();
            toast.success("게시글을 작성했습니다.");
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    }

    async function handleUpdatePost(values: PostFormValues) {
        const post = editingPost;

        if (!post) {
            return;
        }

        try {
            await updatePostMutation.mutateAsync({
                params: {
                    postId: post.id
                },
                request: values
            });
            setEditingPost(null);
            updatePostMutation.reset();
            toast.success("게시글을 수정했습니다.");
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    }

    async function handleConfirmDeletePost(event: MouseEvent<HTMLButtonElement>) {
        event.preventDefault();

        const post = deleteTargetPost;

        if (!post) {
            return;
        }

        try {
            await deletePostMutation.mutateAsync({
                postId: post.id
            });
            setDeleteTargetPost(null);
            deletePostMutation.reset();
            toast.success("게시글을 삭제했습니다.");
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    }

    return (
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">게시글</h1>
                    <p className="text-sm text-muted-foreground">최근 작성된 게시글</p>
                </div>
                <Button type="button" onClick={handleOpenCreateDialog}>
                    <PlusIcon data-icon="inline-start" />새 게시글
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>목록</CardTitle>
                    <CardDescription>{posts.length}개 게시글</CardDescription>
                </CardHeader>
                <CardContent>
                    <PostsTable
                        posts={posts}
                        deletingPostId={deletingPostId}
                        onEditPost={handleEditPost}
                        onDeletePost={handleDeletePost}
                    />
                </CardContent>
            </Card>

            <Dialog open={createDialogOpen} onOpenChange={handleCreateDialogOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>새 게시글</DialogTitle>
                        <DialogDescription>제목과 내용을 입력하세요.</DialogDescription>
                    </DialogHeader>
                    <PostForm
                        isSubmitting={createPostMutation.isPending}
                        submitLabel="작성"
                        errorMessage={createErrorMessage}
                        onSubmit={handleCreatePost}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={editingPost !== null} onOpenChange={handleEditDialogOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>게시글 수정</DialogTitle>
                        <DialogDescription>변경할 제목과 내용을 입력하세요.</DialogDescription>
                    </DialogHeader>
                    {editingPostValues ? (
                        <PostForm
                            key={editingPost?.id}
                            initialValues={editingPostValues}
                            isSubmitting={updatePostMutation.isPending}
                            submitLabel="수정"
                            errorMessage={updateErrorMessage}
                            onSubmit={handleUpdatePost}
                        />
                    ) : null}
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteTargetPost !== null} onOpenChange={handleDeleteDialogOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteErrorMessage ?? "삭제하면 다시 되돌릴 수 없습니다."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletePostMutation.isPending}>취소</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={deletePostMutation.isPending}
                            onClick={handleConfirmDeletePost}
                        >
                            {deletePostMutation.isPending ? <Spinner data-icon="inline-start" /> : null}
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}

function getMutationErrorMessage(error: Error | null) {
    return error ? getErrorMessage(error) : undefined;
}

function getErrorMessage(error: unknown) {
    if (error instanceof ApiClientError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "알 수 없는 오류가 발생했습니다.";
}
