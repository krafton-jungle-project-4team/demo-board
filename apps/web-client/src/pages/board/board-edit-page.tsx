import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { BoardPostListQuery } from "@nmm/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { toast } from "@nmm/ui/components/sonner";
import {
    BoardPostForm,
    boardPostQueryOptions,
    useUpdateBoardPostMutation,
    type BoardPostFormValues
} from "@/features/board";
import { ApiClientError } from "@/shared/api/http-client";

type BoardEditPageProps = {
    postId: number;
    query: BoardPostListQuery;
};

export function BoardEditPage({ postId, query }: BoardEditPageProps) {
    const navigate = useNavigate();
    const postQuery = useSuspenseQuery(boardPostQueryOptions(postId));
    const updatePostMutation = useUpdateBoardPostMutation();
    const errorMessage = updatePostMutation.error ? getErrorMessage(updatePostMutation.error) : undefined;

    async function handleSubmit(values: BoardPostFormValues) {
        try {
            await updatePostMutation.mutateAsync({
                postId,
                request: values
            });
            toast.success("게시글을 수정했습니다.");
            await navigate({
                to: "/board/$postId",
                params: {
                    postId: String(postId)
                },
                search: query
            });
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    }

    return (
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <Card>
                <CardHeader>
                    <CardTitle>게시글 수정</CardTitle>
                    <CardDescription>제목, 내용, 태그를 수정하세요.</CardDescription>
                </CardHeader>
                <CardContent>
                    <BoardPostForm
                        initialPost={postQuery.data}
                        isSubmitting={updatePostMutation.isPending}
                        submitLabel="수정"
                        errorMessage={errorMessage}
                        onSubmit={handleSubmit}
                    />
                </CardContent>
            </Card>
        </section>
    );
}

function getErrorMessage(error: unknown) {
    if (error instanceof ApiClientError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "알 수 없는 오류가 발생했습니다.";
}
