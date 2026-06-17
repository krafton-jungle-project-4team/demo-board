import { Link } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import type { BoardPostListItem, BoardPostListQuery, BoardPostListResponse } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@nmm/ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@nmm/ui/components/empty";
import { BoardPostDongBadge } from "./board-post-dong-badge";

type BoardPostListProps = {
    query: BoardPostListQuery;
    postList: BoardPostListResponse;
    currentUserId?: number;
    deletingPostId?: number;
    onDeletePost: (post: BoardPostListItem) => void;
    onTagSearch: (tagName: string) => void;
};

const boardPostRelativeTimeFormatter = new Intl.RelativeTimeFormat("ko-KR", {
    numeric: "auto"
});
const SECOND_IN_MS = 1000;
const MINUTE_IN_MS = 60 * SECOND_IN_MS;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const MONTH_IN_MS = 30 * DAY_IN_MS;
const YEAR_IN_MS = 365 * DAY_IN_MS;

export function BoardPostList({
    query,
    postList,
    currentUserId,
    deletingPostId,
    onDeletePost,
    onTagSearch
}: BoardPostListProps) {
    if (postList.items.length === 0) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <Pencil />
                    </EmptyMedia>
                    <EmptyTitle>게시글이 없습니다</EmptyTitle>
                    <EmptyDescription>검색 조건에 맞는 게시글을 찾지 못했습니다.</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    const postCards = postList.items.map((post) => (
        <BoardPostCard
            key={post.id}
            query={query}
            post={post}
            isDeleting={deletingPostId === post.id}
            canManagePost={currentUserId !== undefined && post.author.id === currentUserId}
            onDeletePost={onDeletePost}
            onTagSearch={onTagSearch}
        />
    ));

    return <div className="flex flex-col gap-4">{postCards}</div>;
}

type BoardPostCardProps = {
    query: BoardPostListQuery;
    post: BoardPostListItem;
    isDeleting: boolean;
    canManagePost: boolean;
    onDeletePost: (post: BoardPostListItem) => void;
    onTagSearch: (tagName: string) => void;
};

function BoardPostCard({ query, post, isDeleting, canManagePost, onDeletePost, onTagSearch }: BoardPostCardProps) {
    function handleDeleteClick() {
        onDeletePost(post);
    }

    return (
        <Card className="relative cursor-pointer gap-0 rounded-lg border-border bg-card p-5 shadow-none transition-colors hover:bg-muted/50 focus-within:border-ring focus-within:bg-muted/50 focus-within:ring-[3px] focus-within:ring-ring/50 sm:p-6">
            <BoardPostDetailLink query={query} post={post} />
            <CardHeader className="pointer-events-none relative z-10 gap-3 p-0">
                <CardDescription className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <BoardPostDongBadge dongName={post.dongName} />
                    <span className="truncate">{post.author.name}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={post.createdAt}>{formatBoardPostRelativeTime(post.createdAt)}</time>
                </CardDescription>
                {canManagePost ? (
                    <CardAction className="pointer-events-auto">
                        <BoardPostManagementActions
                            query={query}
                            post={post}
                            isDeleting={isDeleting}
                            onDeletePost={handleDeleteClick}
                        />
                    </CardAction>
                ) : null}
            </CardHeader>
            <CardContent className="pointer-events-none relative z-10 mt-3 flex flex-col gap-2 p-0">
                <CardTitle className="text-base leading-6 font-semibold text-foreground">
                    <span className="line-clamp-2">{post.title}</span>
                </CardTitle>
                <p className="line-clamp-3 text-sm text-muted-foreground sm:line-clamp-4">{post.excerpt}</p>
            </CardContent>
            <BoardPostTagsFooter post={post} onTagSearch={onTagSearch} />
        </Card>
    );
}

type BoardPostDetailLinkProps = {
    query: BoardPostListQuery;
    post: BoardPostListItem;
};

function BoardPostDetailLink({ query, post }: BoardPostDetailLinkProps) {
    return (
        <Link
            to="/board/$postId"
            params={{
                postId: String(post.id)
            }}
            search={query}
            aria-label={`${post.title} 상세 보기`}
            className="absolute inset-0 rounded-lg focus-visible:outline-none"
        />
    );
}

function BoardPostTagsFooter({
    post,
    onTagSearch
}: {
    post: BoardPostListItem;
    onTagSearch: (tagName: string) => void;
}) {
    if (post.tags.length === 0) {
        return null;
    }

    const tagItems = post.tags.map((tag) => (
        <BoardPostTagSearchButton key={tag.id} tagName={tag.name} onTagSearch={onTagSearch} />
    ));

    return (
        <CardFooter className="relative z-20 mt-4 flex min-w-0 flex-wrap items-center gap-2 p-0">{tagItems}</CardFooter>
    );
}

type BoardPostTagSearchButtonProps = {
    tagName: string;
    onTagSearch: (tagName: string) => void;
};

function BoardPostTagSearchButton({ tagName, onTagSearch }: BoardPostTagSearchButtonProps) {
    function handleTagSearchClick() {
        onTagSearch(tagName);
    }

    return (
        <Button
            type="button"
            variant="link"
            size="sm"
            aria-label={`${tagName} 태그 검색`}
            className="h-auto min-w-0 rounded-none p-0 text-sm font-medium text-primary hover:underline"
            onClick={handleTagSearchClick}
        >
            #{tagName}
        </Button>
    );
}

type BoardPostManagementActionsProps = {
    query: BoardPostListQuery;
    post: BoardPostListItem;
    isDeleting: boolean;
    onDeletePost: () => void;
};

function BoardPostManagementActions({ query, post, isDeleting, onDeletePost }: BoardPostManagementActionsProps) {
    return (
        <div className="flex shrink-0 items-center gap-1">
            <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label="게시글 수정"
                className="text-muted-foreground hover:text-foreground"
            >
                <Link
                    to="/board/$postId/edit"
                    params={{
                        postId: String(post.id)
                    }}
                    search={query}
                    aria-label="게시글 수정"
                >
                    <Pencil />
                </Link>
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="게시글 삭제"
                className="text-muted-foreground hover:text-destructive"
                disabled={isDeleting}
                onClick={onDeletePost}
            >
                <Trash2 />
            </Button>
        </div>
    );
}

function formatBoardPostRelativeTime(value: string) {
    const createdAt = new Date(value).getTime();
    const elapsedMs = Date.now() - createdAt;

    if (!Number.isFinite(createdAt) || elapsedMs < MINUTE_IN_MS) {
        return "방금 전";
    }

    if (elapsedMs < HOUR_IN_MS) {
        return boardPostRelativeTimeFormatter.format(-Math.floor(elapsedMs / MINUTE_IN_MS), "minute");
    }

    if (elapsedMs < DAY_IN_MS) {
        return boardPostRelativeTimeFormatter.format(-Math.floor(elapsedMs / HOUR_IN_MS), "hour");
    }

    if (elapsedMs < MONTH_IN_MS) {
        return boardPostRelativeTimeFormatter.format(-Math.floor(elapsedMs / DAY_IN_MS), "day");
    }

    if (elapsedMs < YEAR_IN_MS) {
        return boardPostRelativeTimeFormatter.format(-Math.floor(elapsedMs / MONTH_IN_MS), "month");
    }

    return boardPostRelativeTimeFormatter.format(-Math.floor(elapsedMs / YEAR_IN_MS), "year");
}
