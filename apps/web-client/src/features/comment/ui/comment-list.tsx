import type { CommentReplyResponse, CommentResponse } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@nmm/ui/components/empty";
import { Separator } from "@nmm/ui/components/separator";
import { useCreateReplyMutation, useDeleteCommentMutation, useUpdateCommentMutation } from "@/features/comment";
import { CommentForm } from "./comment-form";

type CommentListProps = {
    comments: CommentResponse[];
};

export function CommentList({ comments }: CommentListProps) {
    if (comments.length === 0) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyTitle>댓글이 없습니다</EmptyTitle>
                    <EmptyDescription>첫 댓글을 남겨보세요.</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return <div className="flex flex-col gap-4">{comments.map(renderComment)}</div>;
}

function renderComment(comment: CommentResponse) {
    return <CommentItem key={comment.id} comment={comment} />;
}

type CommentItemProps = {
    comment: CommentResponse;
};

function CommentItem({ comment }: CommentItemProps) {
    const createReplyMutation = useCreateReplyMutation();
    const updateCommentMutation = useUpdateCommentMutation();
    const deleteCommentMutation = useDeleteCommentMutation();

    async function handleReplySubmit(content: string) {
        await createReplyMutation.mutateAsync({
            commentId: comment.id,
            request: {
                content
            }
        });
    }

    async function handleUpdateSubmit(content: string) {
        await updateCommentMutation.mutateAsync({
            commentId: comment.id,
            request: {
                content
            }
        });
    }

    function handleDeleteClick() {
        deleteCommentMutation.mutate(comment.id);
    }

    return (
        <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <CardTitle className="text-base">{comment.author.nickname}</CardTitle>
                    <p className="text-sm text-muted-foreground">{formatDateTime(comment.createdAt)}</p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={comment.isDeleted || deleteCommentMutation.isPending}
                    onClick={handleDeleteClick}
                >
                    삭제
                </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <p className="whitespace-pre-wrap text-sm leading-6">{comment.content}</p>
                {!comment.isDeleted && (
                    <CommentForm
                        label={`comment-${comment.id}-edit`}
                        buttonText="수정"
                        initialContent={comment.content}
                        isPending={updateCommentMutation.isPending}
                        onSubmit={handleUpdateSubmit}
                    />
                )}
                <Separator />
                <CommentForm
                    label={`comment-${comment.id}-reply`}
                    buttonText="대댓글 작성"
                    isPending={createReplyMutation.isPending}
                    onSubmit={handleReplySubmit}
                />
                {comment.replies.length > 0 && (
                    <div className="flex flex-col gap-3 border-l pl-4">{comment.replies.map(renderReply)}</div>
                )}
            </CardContent>
        </Card>
    );
}

function renderReply(reply: CommentReplyResponse) {
    return <ReplyItem key={reply.id} reply={reply} />;
}

type ReplyItemProps = {
    reply: CommentReplyResponse;
};

function ReplyItem({ reply }: ReplyItemProps) {
    const updateCommentMutation = useUpdateCommentMutation();
    const deleteCommentMutation = useDeleteCommentMutation();

    async function handleUpdateSubmit(content: string) {
        await updateCommentMutation.mutateAsync({
            commentId: reply.id,
            request: {
                content
            }
        });
    }

    function handleDeleteClick() {
        deleteCommentMutation.mutate(reply.id);
    }

    return (
        <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{reply.author.nickname}</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(reply.createdAt)}</p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={reply.isDeleted || deleteCommentMutation.isPending}
                    onClick={handleDeleteClick}
                >
                    삭제
                </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6">{reply.content}</p>
            {!reply.isDeleted && (
                <CommentForm
                    label={`reply-${reply.id}-edit`}
                    buttonText="수정"
                    initialContent={reply.content}
                    isPending={updateCommentMutation.isPending}
                    onSubmit={handleUpdateSubmit}
                />
            )}
        </div>
    );
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(value));
}
