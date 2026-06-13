import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Pagination, PaginationContent, PaginationItem } from "@nmm/ui/components/pagination";
import { commentQueryOptions, useCreateCommentMutation } from "@/features/comment";
import { CommentForm } from "@/features/comment/ui/comment-form";
import { CommentList } from "@/features/comment/ui/comment-list";

const COMMENT_PAGE_SIZE = 20;

type CommentPageProps = {
    page: number;
    postId: number;
    onPageChange: (page: number) => void;
};

export function CommentPage({ page, postId, onPageChange }: CommentPageProps) {
    const commentsQuery = useSuspenseQuery(
        commentQueryOptions({
            postId,
            page,
            pageSize: COMMENT_PAGE_SIZE
        })
    );
    const createCommentMutation = useCreateCommentMutation(postId);
    const comments = commentsQuery.data;
    const canGoPrevious = comments.pageInfo.page > 1;
    const canGoNext = comments.pageInfo.page < comments.pageInfo.totalPages;

    async function handleCreateSubmit(content: string) {
        await createCommentMutation.mutateAsync({
            content
        });
    }

    function handlePreviousClick() {
        if (canGoPrevious) {
            onPageChange(page - 1);
        }
    }

    function handleNextClick() {
        if (canGoNext) {
            onPageChange(page + 1);
        }
    }

    return (
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <Card>
                <CardHeader>
                    <CardTitle>댓글</CardTitle>
                    <CardDescription>{postId}번 게시글 댓글입니다.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CommentForm
                        label="new-comment"
                        buttonText="댓글 작성"
                        isPending={createCommentMutation.isPending}
                        onSubmit={handleCreateSubmit}
                    />
                </CardContent>
            </Card>
            <CommentList comments={comments.items} />
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <Button type="button" variant="ghost" disabled={!canGoPrevious} onClick={handlePreviousClick}>
                            이전
                        </Button>
                    </PaginationItem>
                    <PaginationItem>
                        <span className="flex h-9 items-center px-3 text-sm text-muted-foreground">
                            {comments.pageInfo.page} / {Math.max(comments.pageInfo.totalPages, 1)}
                        </span>
                    </PaginationItem>
                    <PaginationItem>
                        <Button type="button" variant="ghost" disabled={!canGoNext} onClick={handleNextClick}>
                            다음
                        </Button>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </section>
    );
}
