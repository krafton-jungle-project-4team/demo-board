import { useNavigate } from "@tanstack/react-router";
import { DEFAULT_BOARD_POST_LIST_QUERY } from "@nmm/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { toast } from "@nmm/ui/components/sonner";
import { BoardPostForm, useCreateBoardPostMutation, type BoardPostFormValues } from "@/features/board";
import { ApiClientError } from "@/shared/api/http-client";

export function BoardNewPage() {
    const navigate = useNavigate();
    const createPostMutation = useCreateBoardPostMutation();
    const errorMessage = createPostMutation.error ? getErrorMessage(createPostMutation.error) : undefined;

    async function handleSubmit(values: BoardPostFormValues) {
        try {
            const response = await createPostMutation.mutateAsync(values);
            toast.success("게시글을 작성했습니다.");
            await navigate({
                to: "/board/$postId",
                params: {
                    postId: String(response.id)
                },
                search: DEFAULT_BOARD_POST_LIST_QUERY
            });
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    }

    return (
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <Card>
                <CardHeader>
                    <CardTitle>새 게시글</CardTitle>
                    <CardDescription>제목, 내용, 태그를 입력하세요.</CardDescription>
                </CardHeader>
                <CardContent>
                    <BoardPostForm
                        isSubmitting={createPostMutation.isPending}
                        submitLabel="작성"
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
