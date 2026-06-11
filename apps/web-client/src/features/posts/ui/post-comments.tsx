import { Check, Pencil, Send, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button, Textarea } from "@nmm/ui/components";
import type { Comment, User } from "@nmm/shared";
import { isActiveUser } from "@/features/auth";
import {
    useCommentsQuery,
    useCreateCommentMutation,
    useDeleteCommentMutation,
    useUpdateCommentMutation
} from "../api/post-queries";
import type { RouteResourceId } from "../api/post-api";
import { canManageComment } from "../model/post-permissions";

type PostCommentsProps = {
    currentUser: User | null | undefined;
    postId: RouteResourceId;
};

export function PostComments({ currentUser, postId }: PostCommentsProps) {
    const commentsQuery = useCommentsQuery(postId);
    const comments = useMemo(() => {
        const items = commentsQuery.data?.items ?? [];

        return [...items].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
    }, [commentsQuery.data?.items]);

    return (
        <section className="grid gap-4 border-t pt-6">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-normal">댓글</h2>
                <span className="text-sm text-muted-foreground">{comments.length}</span>
            </div>

            <CommentComposer currentUser={currentUser} postId={postId} />

            <div className="grid gap-4">
                {comments.map((comment) => (
                    <PostCommentItem key={comment.id} comment={comment} currentUser={currentUser} postId={postId} />
                ))}
                {commentsQuery.isPending ? <p className="text-sm text-muted-foreground">댓글 불러오는 중</p> : null}
                {!commentsQuery.isPending && comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">아직 댓글이 없습니다.</p>
                ) : null}
            </div>
        </section>
    );
}

function CommentComposer({ currentUser, postId }: PostCommentsProps) {
    const [content, setContent] = useState("");
    const createCommentMutation = useCreateCommentMutation({
        onSuccess: handleCreateCommentSuccess
    });
    const canCreateComment = isActiveUser(currentUser);
    const trimmedContent = content.trim();

    function handleCreateCommentSuccess() {
        setContent("");
    }

    function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
        setContent(event.target.value);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!trimmedContent) {
            return;
        }

        createCommentMutation.mutate({
            postId,
            data: {
                content: trimmedContent
            }
        });
    }

    if (currentUser === undefined) {
        return <p className="text-sm text-muted-foreground">계정 확인 중</p>;
    }

    if (!canCreateComment) {
        return <p className="text-sm text-muted-foreground">활성 계정으로 로그인하면 댓글을 작성할 수 있습니다.</p>;
    }

    return (
        <form className="grid gap-2" onSubmit={handleSubmit}>
            <Textarea
                required
                minLength={1}
                placeholder="댓글"
                value={content}
                disabled={createCommentMutation.isPending}
                onChange={handleContentChange}
            />
            <Button
                type="submit"
                className="justify-self-end"
                disabled={createCommentMutation.isPending || !trimmedContent}
            >
                <Send />
                등록
            </Button>
        </form>
    );
}

type PostCommentItemProps = {
    comment: Comment;
    currentUser: User | null | undefined;
    postId: RouteResourceId;
};

function PostCommentItem({ comment, currentUser, postId }: PostCommentItemProps) {
    const [editingContent, setEditingContent] = useState<string | null>(null);
    const updateCommentMutation = useUpdateCommentMutation({
        onSuccess: handleCommentMutationSuccess
    });
    const deleteCommentMutation = useDeleteCommentMutation({
        onSuccess: handleCommentMutationSuccess
    });
    const canManageCurrentComment = canManageComment(currentUser, comment);
    const trimmedContent = editingContent?.trim() ?? "";
    const isEditing = editingContent !== null;

    function handleCommentMutationSuccess() {
        setEditingContent(null);
    }

    function handleEditClick() {
        setEditingContent(comment.content);
    }

    function handleCancelClick() {
        setEditingContent(null);
    }

    function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
        setEditingContent(event.target.value);
    }

    function handleUpdateSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!trimmedContent) {
            return;
        }

        updateCommentMutation.mutate({
            postId,
            commentId: comment.id,
            data: {
                content: trimmedContent
            }
        });
    }

    function handleDeleteClick() {
        deleteCommentMutation.mutate({
            postId,
            commentId: comment.id
        });
    }

    if (isEditing) {
        return (
            <form className="grid gap-2 rounded-lg border p-3" onSubmit={handleUpdateSubmit}>
                <Textarea
                    required
                    minLength={1}
                    value={editingContent ?? ""}
                    disabled={updateCommentMutation.isPending}
                    onChange={handleContentChange}
                />
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={updateCommentMutation.isPending}
                        onClick={handleCancelClick}
                    >
                        <X />
                        취소
                    </Button>
                    <Button type="submit" disabled={updateCommentMutation.isPending || !trimmedContent}>
                        <Check />
                        저장
                    </Button>
                </div>
            </form>
        );
    }

    return (
        <article className="grid gap-2 rounded-lg border p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="grid gap-1">
                    <span className="text-sm font-medium">{comment.authorName}</span>
                    <span className="text-xs text-muted-foreground">{formatCommentDate(comment.createdAt)}</span>
                </div>
                {canManageCurrentComment ? (
                    <div className="flex gap-1">
                        <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label="댓글 수정"
                            onClick={handleEditClick}
                        >
                            <Pencil />
                        </Button>
                        <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label="댓글 삭제"
                            disabled={deleteCommentMutation.isPending}
                            onClick={handleDeleteClick}
                        >
                            <Trash2 />
                        </Button>
                    </div>
                ) : null}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6">{comment.content}</p>
        </article>
    );
}

function formatCommentDate(value: string) {
    return new Date(value).toLocaleString("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}
