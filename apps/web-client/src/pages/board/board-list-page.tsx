import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { type ChangeEvent, type FormEvent, type MouseEvent, useEffect, useState } from "react";
import {
    BoardPostSearchScopeSchema,
    DEFAULT_BOARD_POST_LIST_QUERY,
    type BoardPostListItem,
    type BoardPostListQuery
} from "@nmm/shared";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@nmm/ui/components/alert-dialog";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { toast } from "@nmm/ui/components/sonner";
import { Spinner } from "@nmm/ui/components/spinner";
import {
    BoardPostList,
    BoardPostListPagination,
    BoardPostListSearchForm,
    boardPostListQueryOptions,
    useDeleteBoardPostMutation
} from "@/features/board";
import { ApiClientError } from "@/shared/api/http-client";

type BoardListPageProps = {
    query: BoardPostListQuery;
};

export function BoardListPage({ query }: BoardListPageProps) {
    const navigate = useNavigate({ from: "/board" });
    const postListQuery = useSuspenseQuery(boardPostListQueryOptions(query));
    const deletePostMutation = useDeleteBoardPostMutation();
    const [keyword, setKeyword] = useState(query.q ?? "");
    const [searchScope, setSearchScope] = useState(query.searchScope);
    const [deleteTargetPost, setDeleteTargetPost] = useState<BoardPostListItem | null>(null);
    const postList = postListQuery.data;
    const deletingPostId = deletePostMutation.isPending ? deleteTargetPost?.id : undefined;

    useEffect(() => {
        setKeyword(query.q ?? "");
    }, [query.q]);

    useEffect(() => {
        setSearchScope(query.searchScope);
    }, [query.searchScope]);

    function handleKeywordChange(event: ChangeEvent<HTMLInputElement>) {
        setKeyword(event.target.value);
    }

    function handleSearchScopeChange(value: string) {
        if (!value) {
            return;
        }

        const nextSearchScope = BoardPostSearchScopeSchema.parse(value);
        const nextKeyword = keyword.trim();

        setSearchScope(nextSearchScope);
        void navigateToList({
            page: 1,
            pageSize: query.pageSize,
            searchScope: nextSearchScope,
            q: nextKeyword.length > 0 ? nextKeyword : undefined
        });
    }

    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const nextKeyword = keyword.trim();

        void navigateToList({
            page: 1,
            pageSize: query.pageSize,
            searchScope,
            q: nextKeyword.length > 0 ? nextKeyword : undefined
        });
    }

    function handleClearSearch() {
        setKeyword("");
        void navigateToList({
            page: 1,
            pageSize: query.pageSize,
            searchScope,
            q: undefined
        });
    }

    function handlePageChange(page: number) {
        if (page === query.page) {
            return;
        }

        void navigateToList({
            ...query,
            page
        });
    }

    function handleDeletePost(post: BoardPostListItem) {
        deletePostMutation.reset();
        setDeleteTargetPost(post);
    }

    function handleDeleteDialogOpenChange(isOpen: boolean) {
        if (!isOpen) {
            deletePostMutation.reset();
            setDeleteTargetPost(null);
        }
    }

    async function handleConfirmDeletePost(event: MouseEvent<HTMLButtonElement>) {
        event.preventDefault();

        if (!deleteTargetPost) {
            return;
        }

        try {
            await deletePostMutation.mutateAsync(deleteTargetPost.id);
            toast.success("게시글을 삭제했습니다.");
            setDeleteTargetPost(null);
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    }

    function navigateToList(nextQuery: BoardPostListQuery) {
        return navigate({
            to: "/board",
            search: nextQuery
        });
    }

    return (
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">게시글</h1>
                    <p className="text-sm text-muted-foreground">검색과 태그로 게시글을 찾아보세요.</p>
                </div>
                <Button asChild>
                    <Link to="/board/new" search={DEFAULT_BOARD_POST_LIST_QUERY}>
                        <PlusIcon data-icon="inline-start" />새 게시글
                    </Link>
                </Button>
            </div>
            <BoardPostListSearchForm
                keyword={keyword}
                searchScope={searchScope}
                onKeywordChange={handleKeywordChange}
                onSearchScopeChange={handleSearchScopeChange}
                onSubmit={handleSearchSubmit}
                onClear={handleClearSearch}
            />
            <Card>
                <CardHeader>
                    <CardTitle>목록</CardTitle>
                    <CardDescription>총 {postList.totalItems.toLocaleString("ko-KR")}개</CardDescription>
                </CardHeader>
                <CardContent>
                    <BoardPostList
                        postList={postList}
                        deletingPostId={deletingPostId}
                        onDeletePost={handleDeletePost}
                    />
                </CardContent>
            </Card>
            <BoardPostListPagination query={query} postList={postList} onPageChange={handlePageChange} />
            <AlertDialog open={deleteTargetPost !== null} onOpenChange={handleDeleteDialogOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            삭제하면 댓글과 태그 연결도 함께 삭제되며 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletePostMutation.isPending}>취소</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={deletePostMutation.isPending}
                            onClick={handleConfirmDeletePost}
                        >
                            {deletePostMutation.isPending ? <Spinner data-icon="inline-start" /> : null}
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
