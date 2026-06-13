import { PencilIcon, Trash2Icon } from "lucide-react";
import type { Post } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@nmm/ui/components/empty";
import { Spinner } from "@nmm/ui/components/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nmm/ui/components/table";

type PostsTableProps = {
    posts: Post[];
    deletingPostId: number | undefined;
    onEditPost: (post: Post) => void;
    onDeletePost: (post: Post) => void;
};

type PostTableRowProps = {
    post: Post;
    isDeleting: boolean;
    onEditPost: (post: Post) => void;
    onDeletePost: (post: Post) => void;
};

const postDateFormatter = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
});

export function PostsTable({ posts, deletingPostId, onEditPost, onDeletePost }: PostsTableProps) {
    function renderPostRow(post: Post) {
        return (
            <PostTableRow
                key={post.id}
                post={post}
                isDeleting={deletingPostId === post.id}
                onEditPost={onEditPost}
                onDeletePost={onDeletePost}
            />
        );
    }

    if (posts.length === 0) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyTitle>게시글이 없습니다.</EmptyTitle>
                    <EmptyDescription>첫 게시글을 작성하면 이곳에 표시됩니다.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent />
            </Empty>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[220px]">제목</TableHead>
                    <TableHead>내용</TableHead>
                    <TableHead className="w-[180px]">수정일</TableHead>
                    <TableHead className="w-[150px] text-right">관리</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>{posts.map(renderPostRow)}</TableBody>
        </Table>
    );
}

function PostTableRow({ post, isDeleting, onEditPost, onDeletePost }: PostTableRowProps) {
    function handleEditClick() {
        onEditPost(post);
    }

    function handleDeleteClick() {
        onDeletePost(post);
    }

    return (
        <TableRow>
            <TableCell className="max-w-[220px] whitespace-normal font-medium">{post.title}</TableCell>
            <TableCell className="max-w-[420px] whitespace-normal text-muted-foreground">{post.content}</TableCell>
            <TableCell>{formatPostDate(post.updatedAt)}</TableCell>
            <TableCell>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleEditClick}>
                        <PencilIcon data-icon="inline-start" />
                        수정
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

function formatPostDate(value: string) {
    return postDateFormatter.format(new Date(value));
}
