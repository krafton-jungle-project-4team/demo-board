import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { type ChangeEvent, type FormEvent, type MouseEvent, useEffect, useState } from "react";
import {
    BoardPostSearchScopeSchema,
    SONGPA_BOARD_DONGS,
    SongpaBoardDongCodeSchema,
    getSongpaBoardDongName,
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
import { currentUserQueryOptions } from "@/features/auth";
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

const DONG_FILTER_ALL_VALUE = "ALL";

export function BoardListPage({ query }: BoardListPageProps) {
    const navigate = useNavigate({ from: "/board" });
    const { data: currentUser, isPending: isCurrentUserPending } = useQuery(currentUserQueryOptions);
    const postListQuery = useSuspenseQuery(boardPostListQueryOptions(query));
    const postList = postListQuery.data;
    const deletePostMutation = useDeleteBoardPostMutation();
    const [keyword, setKeyword] = useState(query.q ?? "");
    const [searchScope, setSearchScope] = useState(query.searchScope);
    const [deleteTargetPost, setDeleteTargetPost] = useState<BoardPostListItem | null>(null);
    const deletingPostId = deletePostMutation.isPending ? deleteTargetPost?.id : undefined;
    const selectedDongName = getSongpaBoardDongName(query.dongCode);
    const boardTitle = getBoardTitle(selectedDongName);
    const boardDescription = getBoardDescription(selectedDongName);
    const isSignedIn = currentUser !== null && currentUser !== undefined;

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
            dongCode: query.dongCode,
            page: 1,
            pageSize: query.pageSize,
            searchScope: nextSearchScope,
            q: nextKeyword.length > 0 ? nextKeyword : undefined
        });
    }

    function handleDongFilterChange(value: string) {
        const nextDongCode = value === DONG_FILTER_ALL_VALUE ? undefined : SongpaBoardDongCodeSchema.parse(value);

        void navigateToList({
            ...query,
            dongCode: nextDongCode,
            page: 1
        });
    }

    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const nextKeyword = keyword.trim();

        void navigateToList({
            dongCode: query.dongCode,
            page: 1,
            pageSize: query.pageSize,
            searchScope,
            q: nextKeyword.length > 0 ? nextKeyword : undefined
        });
    }

    function handleClearSearch() {
        setKeyword("");
        void navigateToList({
            dongCode: query.dongCode,
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
                    <h1 className="text-2xl font-semibold tracking-tight">{boardTitle}</h1>
                    <p className="text-sm text-muted-foreground">{boardDescription}</p>
                </div>
                <BoardCreateButton query={query} isPending={isCurrentUserPending} isSignedIn={isSignedIn} />
            </div>
            <DongBoardFilter dongCode={query.dongCode} onDongFilterChange={handleDongFilterChange} />
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
                        query={query}
                        postList={postList}
                        currentUserId={currentUser?.id}
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

function BoardCreateButton({
    query,
    isPending,
    isSignedIn
}: {
    query: BoardPostListQuery;
    isPending: boolean;
    isSignedIn: boolean;
}) {
    if (isPending) {
        return (
            <Button disabled>
                <PlusIcon data-icon="inline-start" />새 게시글
            </Button>
        );
    }

    if (!isSignedIn) {
        return (
            <Button asChild>
                <Link to="/auth/login">
                    <PlusIcon data-icon="inline-start" />새 게시글
                </Link>
            </Button>
        );
    }

    return (
        <Button asChild>
            <Link to="/board/new" search={query}>
                <PlusIcon data-icon="inline-start" />새 게시글
            </Link>
        </Button>
    );
}

type DongBoardFilterProps = {
    dongCode?: string;
    onDongFilterChange: (value: string) => void;
};

function DongBoardFilter({ dongCode, onDongFilterChange }: DongBoardFilterProps) {
    const selectedValue = dongCode ?? DONG_FILTER_ALL_VALUE;

    return (
        <div className="flex flex-wrap gap-2" aria-label="동네 필터">
            <DongBoardFilterButton
                value={DONG_FILTER_ALL_VALUE}
                label="전체"
                isSelected={selectedValue === DONG_FILTER_ALL_VALUE}
                onSelect={onDongFilterChange}
            />
            {SONGPA_BOARD_DONGS.map((dong) => {
                const isSelected = selectedValue === dong.stdgCd;

                return (
                    <DongBoardFilterButton
                        key={dong.stdgCd}
                        value={dong.stdgCd}
                        label={dong.stdgNm}
                        isSelected={isSelected}
                        onSelect={onDongFilterChange}
                    />
                );
            })}
        </div>
    );
}

function DongBoardFilterButton({
    value,
    label,
    isSelected,
    onSelect
}: {
    value: string;
    label: string;
    isSelected: boolean;
    onSelect: (value: string) => void;
}) {
    function handleClick() {
        onSelect(value);
    }

    return (
        <Button
            type="button"
            size="sm"
            variant={isSelected ? "default" : "outline"}
            aria-pressed={isSelected}
            onClick={handleClick}
        >
            {label}
        </Button>
    );
}

function getBoardTitle(dongName?: string | null) {
    if (dongName) {
        return `${dongName} 동네 게시판`;
    }

    return "송파구 동네 게시판";
}

function getBoardDescription(dongName?: string | null) {
    if (dongName) {
        return `${dongName} 주민들이 남긴 이야기를 확인해보세요.`;
    }

    return "송파구 13개 동의 이야기를 모아봤어요.";
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
