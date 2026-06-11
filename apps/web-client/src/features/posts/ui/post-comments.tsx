import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Check from "lucide-react/dist/esm/icons/check.mjs";
import Pencil from "lucide-react/dist/esm/icons/pencil.mjs";
import Send from "lucide-react/dist/esm/icons/send.mjs";
import Trash2 from "lucide-react/dist/esm/icons/trash-2.mjs";
import X from "lucide-react/dist/esm/icons/x.mjs";
import { useController, useForm, type Control, type UseFormSetError } from "react-hook-form";
import { CreateCommentRequestSchema, type Comment, type CreateCommentRequest, type User } from "@nmm/shared";
import { Badge } from "@nmm/ui/components/badge";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent } from "@nmm/ui/components/card";
import { Field, FieldError, FieldLabel } from "@nmm/ui/components/field";
import { Separator } from "@nmm/ui/components/separator";
import { Textarea } from "@nmm/ui/components/textarea";
import { isActiveUser } from "@/features/auth/model/user-status";
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

const EMPTY_COMMENTS: Comment[] = [];
const commentDateFormatter = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
});

export function PostComments({ currentUser, postId }: PostCommentsProps) {
    const commentsQuery = useCommentsQuery(postId);
    const comments = commentsQuery.data?.items ?? EMPTY_COMMENTS;

    return (
        <section className="grid gap-4">
            <Separator />
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-normal">댓글</h2>
                <Badge variant="secondary">{comments.length}</Badge>
            </div>

            <CommentComposer currentUser={currentUser} postId={postId} />

            <div className="grid gap-4">
                {comments.map((comment) => (
                    <PostCommentItem key={comment.id} comment={comment} currentUser={currentUser} postId={postId} />
                ))}
                {commentsQuery.isPending ? (
                    <Card>
                        <CardContent className="text-sm text-muted-foreground">댓글 불러오는 중</CardContent>
                    </Card>
                ) : null}
                {!commentsQuery.isPending && comments.length === 0 ? (
                    <Card>
                        <CardContent className="text-sm text-muted-foreground">아직 댓글이 없습니다.</CardContent>
                    </Card>
                ) : null}
            </div>
        </section>
    );
}

function CommentComposer({ currentUser, postId }: PostCommentsProps) {
    const form = useForm<CreateCommentRequest>({
        resolver: zodResolver(CreateCommentRequestSchema),
        defaultValues: {
            content: ""
        },
        mode: "onChange"
    });
    const contentValue = form.watch("content");
    const createCommentMutation = useCreateCommentMutation({
        onSuccess: handleCreateCommentSuccess
    });
    const canCreateComment = isActiveUser(currentUser);

    function handleCreateCommentSuccess() {
        form.reset();
    }

    function handleSubmit(values: CreateCommentRequest) {
        const data = toTrimmedCommentData(values, form.setError);

        if (!data) {
            return;
        }

        createCommentMutation.mutate({
            postId,
            data
        });
    }

    if (currentUser === undefined) {
        return (
            <Card>
                <CardContent className="text-sm text-muted-foreground">계정 확인 중</CardContent>
            </Card>
        );
    }

    if (!canCreateComment) {
        return (
            <Card>
                <CardContent className="text-sm text-muted-foreground">
                    활성 계정으로 로그인하면 댓글을 작성할 수 있습니다.
                </CardContent>
            </Card>
        );
    }

    return (
        <form className="grid gap-2" onSubmit={form.handleSubmit(handleSubmit)}>
            <CommentContentField
                control={form.control}
                id="comment-content"
                label="댓글"
                placeholder="댓글"
                disabled={createCommentMutation.isPending}
            />
            <Button
                type="submit"
                className="justify-self-end"
                disabled={createCommentMutation.isPending || contentValue.trim().length === 0}
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
    const [isEditing, setIsEditing] = useState(false);
    const updateCommentMutation = useUpdateCommentMutation({
        onSuccess: handleCommentMutationSuccess
    });
    const deleteCommentMutation = useDeleteCommentMutation({
        onSuccess: handleCommentMutationSuccess
    });
    const canManageCurrentComment = canManageComment(currentUser, comment);

    function handleCommentMutationSuccess() {
        setIsEditing(false);
    }

    function handleEditClick() {
        setIsEditing(true);
    }

    function handleCancelClick() {
        setIsEditing(false);
    }

    function handleUpdateSubmit(values: CreateCommentRequest) {
        updateCommentMutation.mutate({
            postId,
            commentId: comment.id,
            data: values
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
            <PostCommentEditForm
                comment={comment}
                isPending={updateCommentMutation.isPending}
                onCancel={handleCancelClick}
                onSubmit={handleUpdateSubmit}
            />
        );
    }

    return (
        <Card className="gap-0 py-0">
            <CardContent className="grid gap-2 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="grid gap-1">
                        <span className="text-sm font-medium">{comment.authorName}</span>
                        <Badge variant="outline">{formatCommentDate(comment.createdAt)}</Badge>
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
            </CardContent>
        </Card>
    );
}

type PostCommentEditFormProps = {
    comment: Comment;
    isPending: boolean;
    onCancel: () => void;
    onSubmit: (values: CreateCommentRequest) => void;
};

function PostCommentEditForm({ comment, isPending, onCancel, onSubmit }: PostCommentEditFormProps) {
    const form = useForm<CreateCommentRequest>({
        resolver: zodResolver(CreateCommentRequestSchema),
        defaultValues: {
            content: comment.content
        },
        mode: "onChange"
    });
    const contentValue = form.watch("content");

    function handleSubmit(values: CreateCommentRequest) {
        const data = toTrimmedCommentData(values, form.setError);

        if (!data) {
            return;
        }

        onSubmit(data);
    }

    return (
        <Card className="gap-0 py-0">
            <form onSubmit={form.handleSubmit(handleSubmit)}>
                <CardContent className="grid gap-2 p-3">
                    <CommentContentField
                        control={form.control}
                        id="comment-edit-content"
                        label="댓글 수정"
                        disabled={isPending}
                    />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
                            <X />
                            취소
                        </Button>
                        <Button type="submit" disabled={isPending || contentValue.trim().length === 0}>
                            <Check />
                            저장
                        </Button>
                    </div>
                </CardContent>
            </form>
        </Card>
    );
}

type CommentContentFieldProps = {
    control: Control<CreateCommentRequest>;
    id: string;
    label: string;
    disabled: boolean;
    placeholder?: string;
};

function CommentContentField({ control, id, label, disabled, placeholder }: CommentContentFieldProps) {
    const { field, fieldState } = useController({
        control,
        name: "content"
    });

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id} className="sr-only">
                {label}
            </FieldLabel>
            <Textarea
                {...field}
                id={id}
                required
                minLength={1}
                placeholder={placeholder}
                aria-invalid={fieldState.invalid}
                disabled={disabled}
            />
            <FieldError>{fieldState.error?.message}</FieldError>
        </Field>
    );
}

function toTrimmedCommentData(
    values: CreateCommentRequest,
    setError: UseFormSetError<CreateCommentRequest>
): CreateCommentRequest | null {
    const content = values.content.trim();

    if (!content) {
        setError("content", {
            type: "manual",
            message: "댓글을 입력해 주세요."
        });
        return null;
    }

    return { content };
}

function formatCommentDate(value: string) {
    return commentDateFormatter.format(new Date(value));
}
