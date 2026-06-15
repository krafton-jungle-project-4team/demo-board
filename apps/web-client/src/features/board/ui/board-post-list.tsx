import { Link } from "@tanstack/react-router";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { DEFAULT_BOARD_POST_LIST_QUERY, type BoardPostListItem, type BoardPostListResponse } from "@nmm/shared";
import { Badge } from "@nmm/ui/components/badge";
import { Button } from "@nmm/ui/components/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@nmm/ui/components/empty";
import { Spinner } from "@nmm/ui/components/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nmm/ui/components/table";
import { BoardAuthorLabel } from "./board-author-label";
import { BoardPostDongBadge } from "./board-post-dong-badge";

type BoardPostListProps = {
    postList: BoardPostListResponse;
    deletingPostId?: number;
    onDeletePost: (post: BoardPostListItem) => void;
};

const boardPostDateFormatter = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
});

export function BoardPostList({ postList, deletingPostId, onDeletePost }: BoardPostListProps) {
    if (postList.items.length === 0) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <PencilIcon />
                    </EmptyMedia>
                    <EmptyTitle>게시글이 없습니다</EmptyTitle>
                    <EmptyDescription>검색 조건에 맞는 게시글을 찾지 못했습니다.</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead className="w-56">태그</TableHead>
                    <TableHead className="w-40">작성자</TableHead>
                    <TableHead className="w-44">작성일</TableHead>
                    <TableHead className="w-36 text-right">관리</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {postList.items.map((post) => (
                    <BoardPostListRow
                        key={post.id}
                        post={post}
                        isDeleting={deletingPostId === post.id}
                        onDeletePost={onDeletePost}
                    />
                ))}
            </TableBody>
        </Table>
    );
}

type BoardPostListRowProps = {
    post: BoardPostListItem;
    isDeleting: boolean;
    onDeletePost: (post: BoardPostListItem) => void;
};

function BoardPostListRow({ post, isDeleting, onDeletePost }: BoardPostListRowProps) {
    function handleDeleteClick() {
        onDeletePost(post);
    }

    return (
        <TableRow>
            <TableCell className="min-w-80">
                <Link
                    to="/board/$postId"
                    params={{
                        postId: String(post.id)
                    }}
                    search={DEFAULT_BOARD_POST_LIST_QUERY}
                    className="flex flex-col gap-1"
                >
                    <span className="flex flex-wrap items-center gap-1.5">
                        <BoardPostDongBadge dongName={post.dongName} />
                        <span className="font-medium">{post.title}</span>
                    </span>
                    <span className="line-clamp-2 text-muted-foreground">{post.excerpt}</span>
                </Link>
            </TableCell>
            <TableCell>
                <BoardPostTags post={post} />
            </TableCell>
            <TableCell className="text-muted-foreground">
                <BoardAuthorLabel author={post.author} />
            </TableCell>
            <TableCell className="text-muted-foreground">{formatBoardPostDate(post.createdAt)}</TableCell>
            <TableCell>
                <div className="flex justify-end gap-2">
                    <Button asChild type="button" variant="outline" size="sm">
                        <Link
                            to="/board/$postId/edit"
                            params={{
                                postId: String(post.id)
                            }}
                            search={DEFAULT_BOARD_POST_LIST_QUERY}
                        >
                            <PencilIcon data-icon="inline-start" />
                            수정
                        </Link>
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled={isDeleting} onClick={handleDeleteClick}>
                        {isDeleting ? <Spinner data-icon="inline-start" /> : <Trash2Icon data-icon="inline-start" />}
                        삭제
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

function BoardPostTags({ post }: { post: BoardPostListItem }) {
    if (post.tags.length === 0) {
        return <span className="text-muted-foreground">-</span>;
    }

    return (
        <div className="flex flex-wrap gap-1">
            {post.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                    {tag.name}
                </Badge>
            ))}
        </div>
    );
}

function formatBoardPostDate(value: string) {
    return boardPostDateFormatter.format(new Date(value));
}
