import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PencilIcon } from "lucide-react";
import { DEFAULT_BOARD_POST_LIST_QUERY } from "@nmm/shared";
import { Badge } from "@nmm/ui/components/badge";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { BoardCommentSection, boardPostQueryOptions } from "@/features/board";

type BoardDetailPageProps = {
    postId: number;
};

const boardPostDetailDateFormatter = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
});

export function BoardDetailPage({ postId }: BoardDetailPageProps) {
    const postQuery = useSuspenseQuery(boardPostQueryOptions(postId));
    const post = postQuery.data;

    return (
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <Card>
                <CardHeader className="gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-col gap-2">
                            <CardTitle className="text-2xl">{post.title}</CardTitle>
                            <CardDescription>
                                {post.author.name} · {formatBoardPostDetailDate(post.createdAt)}
                            </CardDescription>
                        </div>
                        <Button asChild variant="outline" size="sm">
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
