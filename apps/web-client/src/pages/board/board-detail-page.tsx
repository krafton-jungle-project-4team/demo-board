import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PencilIcon } from "lucide-react";
import type { BoardPostListQuery } from "@nmm/shared";
import { Badge } from "@nmm/ui/components/badge";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { currentUserQueryOptions } from "@/features/auth";
import { BoardAuthorLabel, BoardCommentSection, BoardPostDongBadge, boardPostQueryOptions } from "@/features/board";

type BoardDetailPageProps = {
    postId: number;
    query: BoardPostListQuery;
};

const boardPostDetailDateFormatter = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
});

export function BoardDetailPage({ postId, query }: BoardDetailPageProps) {
    const postQuery = useSuspenseQuery(boardPostQueryOptions(postId));
    const { data: currentUser } = useQuery(currentUserQueryOptions);
    const post = postQuery.data;
    const canManagePost = currentUser?.id === post.author.id;

    return (
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <Card>
                <CardHeader className="gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-col gap-2">
                            <CardTitle className="text-2xl">{post.title}</CardTitle>
                            <CardDescription className="flex flex-wrap items-center gap-1.5">
                                <BoardPostDongBadge dongName={post.dongName} />
                                <BoardAuthorLabel author={post.author} />
                                <span>·</span>
                                <span>{formatBoardPostDetailDate(post.createdAt)}</span>
                            </CardDescription>
                        </div>
                        {canManagePost ? (
                            <Button asChild variant="outline" size="sm">
                                <Link
                                    to="/board/$postId/edit"
                                    params={{
                                        postId: String(post.id)
                                    }}
                                    search={query}
                                >
                                    <PencilIcon data-icon="inline-start" />
                                    수정
                                </Link>
                            </Button>
                        ) : null}
                    </div>
                    {post.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {post.tags.map((tag) => (
                                <Badge key={tag.id} variant="secondary">
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    ) : null}
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap leading-7">{post.content}</p>
                </CardContent>
            </Card>
            <BoardCommentSection postId={post.id} />
        </section>
    );
}

function formatBoardPostDetailDate(value: string) {
    return boardPostDetailDateFormatter.format(new Date(value));
}
