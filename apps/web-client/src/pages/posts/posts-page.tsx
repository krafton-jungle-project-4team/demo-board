import { useSuspenseQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
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
import {
    PostForm,
    PostsTable,
    postsQueryOptions,
    useCreatePostMutation,
    useDeletePostMutation,
    useUpdatePostMutation,
    type PostFormValues
} from "@/features/posts";

export function PostsPage() {
    const postsQuery = useSuspenseQuery(postsQueryOptions);
    const createPostMutation = useCreatePostMutation();
    const updatePostMutation = useUpdatePostMutation();
    const deletePostMutation = useDeletePostMutation();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [deletingPost, setDeletingPost] = useState<Post | null>(null);

    const posts = postsQuery.data.posts;
    const deletingPostId = deletePostMutation.isPending ? deletingPost?.id : undefined;
    const editingPostValues = editingPost
        ? {
              title: editingPost.title,
              content: editingPost.content
          }
        : undefined;

    function handleOpenCreateDialog() {
        setIsCreateDialogOpen(true);
    }

    function handleCreateDialogOpenChange(isOpen: boolean) {
        setIsCreateDialogOpen(isOpen);
    }

    function handleEditDialogOpenChange(isOpen: boolean) {
        if (!isOpen) {
            setEditingPost(null);
        }
    }

    function handleDeleteDialogOpenChange(isOpen: boolean) {
        if (!isOpen) {
            setDeletingPost(null);
        }
    }

    function handleEditPost(post: Post) {
        setEditingPost(post);
    }

    function handleDeletePost(post: Post) {
        setDeletingPost(post);
    }

    async function handleCreatePost(values: PostFormValues) {
        await createPostMutation.mutateAsync(values);
        setIsCreateDialogOpen(false);
    }

    async function handleUpdatePost(values: PostFormValues) {
        if (!editingPost) {
            return;
        }

        await updatePostMutation.mutateAsync({
            params: {
                postId: editingPost.id
            },
            request: values
        });
        setEditingPost(null);
    }

    async function handleConfirmDeletePost() {
        if (!deletingPost) {
            return;
        }

        await deletePostMutation.mutateAsync({
            postId: deletingPost.id
        });
        setDeletingPost(null);
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

            <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>새 게시글</DialogTitle>
                        <DialogDescription>제목과 내용을 입력하세요.</DialogDescription>
                    </DialogHeader>
                    <PostForm
                        isSubmitting={createPostMutation.isPending}
                        submitLabel="작성"
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
                            onSubmit={handleUpdatePost}
                        />
                    ) : null}
                </DialogContent>
            </Dialog>

            <AlertDialog open={deletingPost !== null} onOpenChange={handleDeleteDialogOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
                        <AlertDialogDescription>삭제하면 다시 되돌릴 수 없습니다.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletePostMutation.isPending}>취소</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={deletePostMutation.isPending}
                            onClick={handleConfirmDeletePost}
                        >
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}
