import type { PostListItem, PostListResponse } from "@nmm/shared";
import { Badge } from "@nmm/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@nmm/ui/components/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nmm/ui/components/table";
import { FileTextIcon } from "lucide-react";

const postListDateFormatter = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
});

type PostListTableProps = {
    postList: PostListResponse;
};

export function PostListTable({ postList }: PostListTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>게시글</CardTitle>
                <CardDescription>총 {postList.totalItems.toLocaleString("ko-KR")}개</CardDescription>
            </CardHeader>
            <CardContent>
                {postList.items.length > 0 ? <PostListRows items={postList.items} /> : <PostListEmpty />}
            </CardContent>
        </Card>
    );
}

function PostListRows({ items }: { items: PostListItem[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>태그</TableHead>
                    <TableHead className="w-44">작성일</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="min-w-80">
                            <div className="flex flex-col gap-1">
                                <span className="font-medium">{item.title}</span>
                                <span className="line-clamp-2 text-muted-foreground">{item.excerpt}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <PostListTags tags={item.tags} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatPostListDate(item.createdAt)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function PostListTags({ tags }: { tags: string[] }) {
    if (tags.length === 0) {
        return <span className="text-muted-foreground">-</span>;
    }

    return (
        <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                    {tag}
                </Badge>
            ))}
        </div>
    );
}

function PostListEmpty() {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <FileTextIcon />
                </EmptyMedia>
                <EmptyTitle>게시글이 없습니다</EmptyTitle>
                <EmptyDescription>검색 조건에 맞는 게시글을 찾지 못했습니다.</EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}

function formatPostListDate(createdAt: string) {
    return postListDateFormatter.format(new Date(createdAt));
}
