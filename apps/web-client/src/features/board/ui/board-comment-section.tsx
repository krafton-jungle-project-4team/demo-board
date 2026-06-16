import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MessageCircleIcon, PencilIcon, ReplyIcon, Trash2Icon } from "lucide-react";
import { type FormEvent, type MouseEvent, type ReactNode, useEffect, useState } from "react";
import type { BoardAuthor, BoardCommentPageInfo, BoardCommentReplyResponse, BoardCommentResponse } from "@nmm/shared";
import { Alert, AlertDescription } from "@nmm/ui/components/alert";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@nmm/ui/components/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@nmm/ui/components/field";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@nmm/ui/components/pagination";
import { Separator } from "@nmm/ui/components/separator";
import { Spinner } from "@nmm/ui/components/spinner";
import { Textarea } from "@nmm/ui/components/textarea";
import { boardCommentsQueryOptions } from "../api/board-queries";
import {
    useCreateBoardCommentMutation,
    useCreateBoardCommentReplyMutation,
    useDeleteBoardCommentMutation,
    useUpdateBoardCommentMutation
} from "../api/board-mutations";
import { currentUserQueryOptions } from "@/features/auth";
import { BoardAuthorLabel } from "./board-author-label";

const BOARD_COMMENT_PAGE_SIZE = 20;
const DISABLED_COMMENT_PAGINATION_LINK_CLASS_NAME = "pointer-events-none opacity-50";
const EMPTY_COMMENT_FORM_VALUE = "";
const MAX_VISIBLE_COMMENT_PAGE_COUNT = 5;

type BoardCommentSectionProps = {
    postId: number;
    page: number;
    createPageHref: (page: number) => string;
    onPageChange: (page: number) => void;
};

const boardCommentDateFormatter = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
});

export function BoardCommentSection({ postId, page, createPageHref, onPageChange }: BoardCommentSectionProps) {
    const commentsQuery = useSuspenseQuery(
        boardCommentsQueryOptions(postId, {
            page,
            pageSize: BOARD_COMMENT_PAGE_SIZE
        })
    );
    const { data: currentUser, isPending: isCurrentUserPending } = useQuery(currentUserQueryOptions);
    const createCommentMutation = useCreateBoardCommentMutation(postId);
    const pageInfo = commentsQuery.data.pageInfo;
    const commentWriteState = getCommentWriteState({
        isSignedIn: currentUser !== null && currentUser !== undefined,
        isCheckingUser: isCurrentUserPending
    });
    const canCreateComment = commentWriteState === "can";

    useEffect(() => {
        const lastAvailablePage = Math.max(1, pageInfo.totalPages);

        if (page > lastAvailablePage) {
            onPageChange(lastAvailablePage);
        }
    }, [onPageChange, page, pageInfo.totalPages]);

    async function handleCreateComment(content: string) {
        await createCommentMutation.mutateAsync({
            content
        });

        if (page !== 1) {
            onPageChange(1);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>댓글</CardTitle>
                <CardDescription>{pageInfo.totalCount.toLocaleString("ko-KR")}개</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
                {commentWriteState === "checking" ? (
                    <p className="text-sm text-muted-foreground">댓글 작성 권한을 확인하는 중</p>
                ) : canCreateComment ? (
                    <BoardCommentForm
                        id="new-board-comment"
                        label="새 댓글"
                        submitLabel="댓글 작성"
                        isPending={createCommentMutation.isPending}
                        onSubmit={handleCreateComment}
                    />
                ) : (
                    <BoardCommentWriteNotice state={commentWriteState} />
                )}
                <Separator />
                {commentsQuery.data.items.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {commentsQuery.data.items.map((comment) => (
                            <BoardCommentItem
                                key={comment.id}
                                comment={comment}
                                currentUserId={currentUser?.id}
                                canCreateReply={canCreateComment}
                            />
                        ))}
                    </div>
                ) : (
                    <BoardCommentEmpty />
                )}
                <BoardCommentPagination
                    pageInfo={pageInfo}
                    createPageHref={createPageHref}
                    onPageChange={onPageChange}
                />
            </CardContent>
        </Card>
    );
}

type CommentWriteState = "can" | "checking" | "loginRequired";

function getCommentWriteState({
    isSignedIn,
    isCheckingUser
}: {
    isSignedIn: boolean;
    isCheckingUser: boolean;
}): CommentWriteState {
    if (isCheckingUser) {
        return "checking";
    }

    if (!isSignedIn) {
        return "loginRequired";
    }

    return "can";
}

function BoardCommentWriteNotice({ state }: { state: CommentWriteState }) {
    if (state === "loginRequired") {
        return (
            <Alert>
                <AlertDescription className="flex flex-col gap-3">
                    <span>로그인 후 댓글을 작성할 수 있어요.</span>
                    <Button asChild className="self-start">
                        <Link to="/auth/login">로그인</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    return null;
}

function BoardCommentEmpty() {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <MessageCircleIcon />
                </EmptyMedia>
                <EmptyTitle>댓글이 없습니다</EmptyTitle>
                <EmptyDescription>첫 댓글을 남겨보세요.</EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}

type BoardCommentPaginationProps = {
    pageInfo: BoardCommentPageInfo;
    createPageHref: (page: number) => string;
    onPageChange: (page: number) => void;
};

function BoardCommentPagination({ pageInfo, createPageHref, onPageChange }: BoardCommentPaginationProps) {
    if (pageInfo.totalPages <= 1) {
        return null;
    }

    const currentPage = clampPage(pageInfo.page, pageInfo.totalPages);
    const previousPage = Math.max(1, currentPage - 1);
    const nextPage = Math.min(pageInfo.totalPages, currentPage + 1);
    const visiblePages = getVisibleCommentPages(currentPage, pageInfo.totalPages);

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <BoardCommentPreviousPageLink
                        page={previousPage}
                        disabled={currentPage <= 1}
                        createPageHref={createPageHref}
                        onPageChange={onPageChange}
                    />
                </PaginationItem>
                {visiblePages.map((pageItem, index) =>
                    pageItem === "ellipsis" ? (
                        <PaginationItem key={createCommentPaginationItemKey(pageItem, index)}>
                            <PaginationEllipsis />
                        </PaginationItem>
                    ) : (
                        <PaginationItem key={createCommentPaginationItemKey(pageItem, index)}>
                            <BoardCommentPageLink
                                page={pageItem}
                                isActive={pageItem === currentPage}
                                createPageHref={createPageHref}
                                onPageChange={onPageChange}
                            >
                                {pageItem}
                            </BoardCommentPageLink>
                        </PaginationItem>
                    )
                )}
                <PaginationItem>
                    <BoardCommentNextPageLink
                        page={nextPage}
                        disabled={currentPage >= pageInfo.totalPages}
                        createPageHref={createPageHref}
                        onPageChange={onPageChange}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}

type BoardCommentPageLinkProps = {
    page: number;
    isActive?: boolean;
    disabled?: boolean;
    createPageHref: (page: number) => string;
    onPageChange: (page: number) => void;
    children?: ReactNode;
};

function BoardCommentPageLink({
    page,
    isActive,
    disabled,
    createPageHref,
    onPageChange,
    children
}: BoardCommentPageLinkProps) {
    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();

        if (disabled || isActive) {
            return;
        }

        onPageChange(page);
    }

    return (
        <PaginationLink
            href={createPageHref(page)}
            isActive={isActive}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            className={disabled ? DISABLED_COMMENT_PAGINATION_LINK_CLASS_NAME : undefined}
            onClick={handleClick}
        >
            {children}
        </PaginationLink>
    );
}

function BoardCommentPreviousPageLink({ page, disabled, createPageHref, onPageChange }: BoardCommentPageLinkProps) {
    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();

        if (disabled) {
            return;
        }

        onPageChange(page);
    }

    return (
        <PaginationPrevious
            href={createPageHref(page)}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            className={disabled ? DISABLED_COMMENT_PAGINATION_LINK_CLASS_NAME : undefined}
            onClick={handleClick}
        />
    );
}

function BoardCommentNextPageLink({ page, disabled, createPageHref, onPageChange }: BoardCommentPageLinkProps) {
    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();

        if (disabled) {
            return;
        }

        onPageChange(page);
    }

    return (
        <PaginationNext
            href={createPageHref(page)}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            className={disabled ? DISABLED_COMMENT_PAGINATION_LINK_CLASS_NAME : undefined}
            onClick={handleClick}
        />
    );
}

type VisibleCommentPageItem = number | "ellipsis";

function getVisibleCommentPages(page: number, totalPages: number): VisibleCommentPageItem[] {
    if (totalPages <= MAX_VISIBLE_COMMENT_PAGE_COUNT) {
        return Array.from({ length: totalPages }, createCommentPageNumber);
    }

    if (page <= 3) {
        return [1, 2, 3, 4, "ellipsis", totalPages];
    }

    if (page >= totalPages - 2) {
        return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
}

function createCommentPageNumber(_: unknown, index: number) {
    return index + 1;
}

function createCommentPaginationItemKey(pageItem: VisibleCommentPageItem, index: number) {
    return `${pageItem}-${index}`;
}

function clampPage(page: number, totalPages: number) {
    return Math.min(Math.max(page, 1), totalPages);
}

function BoardCommentItem({
    comment,
    currentUserId,
    canCreateReply
}: {
    comment: BoardCommentResponse;
    currentUserId?: number;
    canCreateReply: boolean;
}) {
    const [replyOpen, setReplyOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const createReplyMutation = useCreateBoardCommentReplyMutation();
    const updateCommentMutation = useUpdateBoardCommentMutation();
    const deleteCommentMutation = useDeleteBoardCommentMutation();
    const canManageComment = currentUserId === comment.author.id;

    async function handleReplySubmit(content: string) {
        await createReplyMutation.mutateAsync({
            commentId: comment.id,
            request: {
                content
            }
        });
        setReplyOpen(false);
    }

    async function handleUpdateSubmit(content: string) {
        await updateCommentMutation.mutateAsync({
            commentId: comment.id,
            request: {
                content
            }
        });
        setEditing(false);
    }

    function handleReplyClick() {
        if (!canCreateReply) {
            return;
        }

        setReplyOpen((isOpen) => !isOpen);
    }

    function handleEditClick() {
        if (comment.isDeleted) {
            return;
        }

        setEditing((isEditing) => !isEditing);
    }

    function handleDeleteClick() {
        if (comment.isDeleted) {
            return;
        }

        deleteCommentMutation.mutate(comment.id);
    }

    return (
        <article className="flex flex-col gap-4 rounded-md border p-4">
            <BoardCommentHeader
                author={comment.author}
                createdAt={comment.createdAt}
                isDeleted={comment.isDeleted}
                canManage={canManageComment}
                isDeleting={deleteCommentMutation.isPending}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
            />
            {editing && !comment.isDeleted ? (
                <BoardCommentForm
                    id={`board-comment-${comment.id}-edit`}
                    label="댓글 수정"
                    initialContent={comment.content}
                    submitLabel="수정"
                    isPending={updateCommentMutation.isPending}
                    onSubmit={handleUpdateSubmit}
                />
            ) : (
                <p className="whitespace-pre-wrap text-sm leading-6">{comment.content}</p>
            )}
            {!comment.isDeleted ? (
                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!canCreateReply}
                        onClick={handleReplyClick}
                    >
                        <ReplyIcon data-icon="inline-start" />
                        답글
                    </Button>
                </div>
            ) : null}
            {replyOpen ? (
                <BoardCommentForm
                    id={`board-comment-${comment.id}-reply`}
                    label="답글 작성"
                    submitLabel="답글 작성"
                    isPending={createReplyMutation.isPending}
                    onSubmit={handleReplySubmit}
                />
            ) : null}
            {comment.replies.length > 0 ? (
                <div className="flex flex-col gap-3 border-l pl-4">
                    {comment.replies.map((reply) => (
                        <BoardCommentReplyItem key={reply.id} reply={reply} currentUserId={currentUserId} />
                    ))}
                </div>
            ) : null}
        </article>
    );
}

function BoardCommentReplyItem({ reply, currentUserId }: { reply: BoardCommentReplyResponse; currentUserId?: number }) {
    const [editing, setEditing] = useState(false);
    const updateCommentMutation = useUpdateBoardCommentMutation();
    const deleteCommentMutation = useDeleteBoardCommentMutation();
    const canManageReply = currentUserId === reply.author.id;

    async function handleUpdateSubmit(content: string) {
        await updateCommentMutation.mutateAsync({
            commentId: reply.id,
            request: {
                content
            }
        });
        setEditing(false);
    }

    function handleEditClick() {
        if (reply.isDeleted) {
            return;
        }

        setEditing((isEditing) => !isEditing);
    }

    function handleDeleteClick() {
        if (reply.isDeleted) {
            return;
        }

        deleteCommentMutation.mutate(reply.id);
    }

    return (
        <article className="flex flex-col gap-3 rounded-md bg-muted/30 p-4">
            <BoardCommentHeader
                author={reply.author}
                createdAt={reply.createdAt}
                isDeleted={reply.isDeleted}
                canManage={canManageReply}
                isDeleting={deleteCommentMutation.isPending}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
            />
            {editing && !reply.isDeleted ? (
                <BoardCommentForm
                    id={`board-comment-reply-${reply.id}-edit`}
                    label="답글 수정"
                    initialContent={reply.content}
                    submitLabel="수정"
                    isPending={updateCommentMutation.isPending}
                    onSubmit={handleUpdateSubmit}
                />
            ) : (
                <p className="whitespace-pre-wrap text-sm leading-6">{reply.content}</p>
            )}
        </article>
    );
}

type BoardCommentHeaderProps = {
    author: BoardAuthor;
    createdAt: string;
    isDeleted: boolean;
    canManage: boolean;
    isDeleting: boolean;
    onEditClick: () => void;
    onDeleteClick: () => void;
};

function BoardCommentHeader({
    author,
    createdAt,
    isDeleted,
    canManage,
    isDeleting,
    onEditClick,
    onDeleteClick
}: BoardCommentHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">
                    <BoardAuthorLabel author={author} />
                </p>
                <p className="text-sm text-muted-foreground">{formatBoardCommentDate(createdAt)}</p>
            </div>
            {canManage && !isDeleted ? (
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={onEditClick}>
                        <PencilIcon data-icon="inline-start" />
                        수정
                    </Button>
                    <Button type="button" variant="ghost" size="sm" disabled={isDeleting} onClick={onDeleteClick}>
                        {isDeleting ? <Spinner data-icon="inline-start" /> : <Trash2Icon data-icon="inline-start" />}
                        삭제
                    </Button>
                </div>
            ) : null}
        </div>
    );
}

type BoardCommentFormProps = {
    id: string;
    label: string;
    submitLabel: string;
    initialContent?: string;
    isPending: boolean;
    onSubmit: (content: string) => Promise<void> | void;
};

function BoardCommentForm({
    id,
    label,
    submitLabel,
    initialContent = EMPTY_COMMENT_FORM_VALUE,
    isPending,
    onSubmit
}: BoardCommentFormProps) {
    const [content, setContent] = useState(initialContent);
    const trimmedContent = content.trim();
    const isInvalid = trimmedContent.length > 300;
    const isSubmitDisabled = isPending || trimmedContent.length === 0 || isInvalid;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isSubmitDisabled) {
            return;
        }

        await onSubmit(trimmedContent);
        setContent(EMPTY_COMMENT_FORM_VALUE);
    }

    function handleContentChange(event: FormEvent<HTMLTextAreaElement>) {
        setContent(event.currentTarget.value);
    }

    return (
        <form onSubmit={handleSubmit}>
            <FieldGroup>
                <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={id}>{label}</FieldLabel>
                    <Textarea
                        id={id}
                        value={content}
                        maxLength={300}
                        rows={3}
                        disabled={isPending}
                        aria-invalid={isInvalid}
                        onChange={handleContentChange}
                        placeholder="댓글을 입력하세요."
                    />
                    <FieldError>{isInvalid ? "댓글은 300자 이하로 입력하세요." : undefined}</FieldError>
                </Field>
                <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">{trimmedContent.length}/300</span>
                    <Button type="submit" disabled={isSubmitDisabled}>
                        {isPending ? <Spinner data-icon="inline-start" /> : null}
                        {submitLabel}
                    </Button>
                </div>
            </FieldGroup>
        </form>
    );
}

function formatBoardCommentDate(value: string) {
    return boardCommentDateFormatter.format(new Date(value));
}
