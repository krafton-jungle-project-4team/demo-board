import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { BoardPostListQuery } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { toast } from "@nmm/ui/components/sonner";
import { currentUserQueryOptions } from "@/features/auth";
import { BoardPostForm, useCreateBoardPostMutation, type BoardPostFormValues } from "@/features/board";
import { ApiClientError } from "@/shared/api/http-client";

type BoardNewPageProps = {
    query: BoardPostListQuery;
};

export function BoardNewPage({ query }: BoardNewPageProps) {
    const navigate = useNavigate();
    const { data: currentUser, isPending: isCurrentUserPending } = useQuery(currentUserQueryOptions);
    const createPostMutation = useCreateBoardPostMutation();
    const errorMessage = createPostMutation.error ? getErrorMessage(createPostMutation.error) : undefined;
    const isSignedIn = currentUser !== null && currentUser !== undefined;
    const canCreatePost = isSignedIn && Boolean(currentUser.residenceDongCode);
    const shouldShowResidenceDongSetup = !isCurrentUserPending && isSignedIn && !canCreatePost;
    const cardHeader = getBoardWriteCardHeader({
        isCurrentUserPending,
        isSignedIn
    });
    const pageDescription = shouldShowResidenceDongSetup
        ? "먼저 거주동을 설정하면 동네 글을 쓸 수 있어요."
        : "현재 거주동 기준으로 동네 게시판에 등록됩니다.";

    async function handleSubmit(values: BoardPostFormValues) {
        try {
            const response = await createPostMutation.mutateAsync({
                title: values.title,
                content: values.content,
                tags: values.tags
            });
            toast.success("게시글을 작성했습니다.");
            await navigate({
                to: "/board/$postId",
                params: {
                    postId: String(response.id)
                },
                search: query
            });
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    }

    return (
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">동네 게시글 작성</h1>
                <p className="text-sm text-muted-foreground">{pageDescription}</p>
            </div>
            {shouldShowResidenceDongSetup ? (
                <BoardResidenceDongSetupCard query={query} />
            ) : (
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle>{cardHeader.title}</CardTitle>
                        <CardDescription>{cardHeader.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isCurrentUserPending ? (
                            <p className="text-sm text-muted-foreground">작성 권한을 확인하는 중</p>
                        ) : canCreatePost ? (
                            <BoardPostForm
                                isSubmitting={createPostMutation.isPending}
                                submitLabel="작성"
                                errorMessage={errorMessage}
                                onSubmit={handleSubmit}
                            />
                        ) : (
                            <BoardWriteSetup isSignedIn={isSignedIn} />
                        )}
                    </CardContent>
                </Card>
            )}
        </section>
    );
}

function BoardWriteSetup({ isSignedIn }: { isSignedIn: boolean }) {
    if (!isSignedIn) {
        return (
            <div className="flex flex-col gap-4">
                <Button asChild className="self-start">
                    <Link to="/auth/login">로그인</Link>
                </Button>
            </div>
        );
    }

    return null;
}

function BoardResidenceDongSetupCard({ query }: { query: BoardPostListQuery }) {
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>거주동 설정 필요</CardTitle>
                <CardDescription>게시글 작성 전에 거주동을 먼저 설정해주세요.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link
                        to="/profile"
                        search={{
                            ...query,
                            redirectTo: "boardNew"
                        }}
                    >
                        거주동 설정
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function getBoardWriteCardHeader({
    isCurrentUserPending,
    isSignedIn
}: {
    isCurrentUserPending: boolean;
    isSignedIn: boolean;
}) {
    if (isCurrentUserPending) {
        return {
            title: "작성 권한 확인 중",
            description: "잠시만 기다려주세요."
        };
    }

    if (!isSignedIn) {
        return {
            title: "로그인이 필요합니다",
            description: "로그인 후 글을 작성할 수 있어요."
        };
    }

    return {
        title: "글 내용",
        description: "제목, 내용, 태그를 입력하세요."
    };
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
