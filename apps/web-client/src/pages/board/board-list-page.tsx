import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Suspense, type ChangeEvent, type FormEvent, type MouseEvent, useEffect, useState, useTransition } from "react";
import {
    BoardPostSearchScopeSchema,
    SONGPA_BOARD_DONGS,
    SongpaBoardDongCodeSchema,
    getSongpaBoardDongName,
    type BoardPostListItem,
    type BoardPostListQuery,
    type BoardPostSearchScope
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
import { Badge } from "@nmm/ui/components/badge";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardHeader } from "@nmm/ui/components/card";
import { Skeleton } from "@nmm/ui/components/skeleton";
import { toast } from "@nmm/ui/components/sonner";
import { Spinner } from "@nmm/ui/components/spinner";
import { ToggleGroup, ToggleGroupItem } from "@nmm/ui/components/toggle-group";
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
const BOARD_POST_LIST_LOADING_CARD_KEYS = ["first", "second", "third"];
const DONG_BOARD_FILTER_OPTIONS = [
    {
        value: DONG_FILTER_ALL_VALUE,
        label: "전체"
    },
    ...SONGPA_BOARD_DONGS.map((dong) => ({
        value: dong.stdgCd,
        label: dong.stdgNm
    }))
];

export function BoardListPage({ query }: BoardListPageProps) {
    const navigate = useNavigate({ from: "/board" });
    const { data: currentUser, isPending: isCurrentUserPending } = useQuery(currentUserQueryOptions);
    const deletePostMutation = useDeleteBoardPostMutation();
    const [isListNavigationPending, startListNavigationTransition] = useTransition();
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

        setSearchScope(nextSearchScope);
        navigateToSearch(nextSearchScope, keyword);
    }

    function handleDongFilterChange(value: string) {
        if (!value) {
            return;
        }

        const nextDongCode = value === DONG_FILTER_ALL_VALUE ? undefined : SongpaBoardDongCodeSchema.parse(value);

        navigateToList({
            ...query,
            dongCode: nextDongCode,
            page: 1
        });
    }

    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        navigateToSearch(searchScope, keyword);
    }

    function handleClearSearch() {
        setKeyword("");
        navigateToSearch(searchScope, "");
    }

    function handleTagSearch(tagName: string) {
        setKeyword(tagName);
        setSearchScope("tag");
        navigateToSearch("tag", tagName);
    }

    function handlePageChange(page: number) {
        if (page === query.page) {
            return;
        }

        navigateToList({
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
        startListNavigationTransition(() => {
            void navigate({
                to: "/board",
                search: nextQuery
            });
        });
    }

    function navigateToSearch(nextSearchScope: BoardPostSearchScope, nextKeyword: string) {
        const trimmedKeyword = nextKeyword.trim();

        return navigateToList({
            dongCode: query.dongCode,
            page: 1,
            pageSize: query.pageSize,
            searchScope: nextSearchScope,
            q: trimmedKeyword.length > 0 ? trimmedKeyword : undefined
        });
    }

    return (
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{boardTitle}</h1>
                        <Suspense fallback={<BoardPostTotalCountBadgeFallback />}>
                            <BoardPostTotalCountBadge query={query} />
                        </Suspense>
                    </div>
                    <p className="text-sm text-muted-foreground">{boardDescription}</p>
                </div>
                <BoardCreateButton query={query} isPending={isCurrentUserPending} isSignedIn={isSignedIn} />
            </div>
            <BoardPostListSearchForm
                keyword={keyword}
                searchScope={searchScope}
                onKeywordChange={handleKeywordChange}
                onSearchScopeChange={handleSearchScopeChange}
                onSubmit={handleSearchSubmit}
                onClear={handleClearSearch}
            />
            <DongBoardFilter dongCode={query.dongCode} onDongFilterChange={handleDongFilterChange} />
            <Suspense fallback={<BoardPostListResultsLoading />}>
                <BoardPostListResults
                    query={query}
                    isPending={isListNavigationPending}
                    currentUserId={currentUser?.id}
                    deletingPostId={deletingPostId}
                    onDeletePost={handleDeletePost}
                    onTagSearch={handleTagSearch}
                    onPageChange={handlePageChange}
                />
            </Suspense>
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

type BoardPostTotalCountBadgeProps = {
    query: BoardPostListQuery;
};

function BoardPostTotalCountBadge({ query }: BoardPostTotalCountBadgeProps) {
    const { data: postList } = useSuspenseQuery(boardPostListQueryOptions(query));

    return <Badge variant="secondary">{postList.totalItems.toLocaleString("ko-KR")}개</Badge>;
}

function BoardPostTotalCountBadgeFallback() {
    return <Skeleton className="h-6 w-14 rounded-full" />;
}

type BoardPostListResultsProps = {
    query: BoardPostListQuery;
    isPending: boolean;
    currentUserId?: number;
    deletingPostId?: number;
    onDeletePost: (post: BoardPostListItem) => void;
    onTagSearch: (tagName: string) => void;
    onPageChange: (page: number) => void;
};

function BoardPostListResults({
    query,
    isPending,
    currentUserId,
    deletingPostId,
    onDeletePost,
    onTagSearch,
    onPageChange
}: BoardPostListResultsProps) {
    const { data: postList } = useSuspenseQuery(boardPostListQueryOptions(query));
    const contentClassName = isPending
        ? "pointer-events-none flex flex-col gap-6 opacity-60 transition-opacity"
        : "flex flex-col gap-6 transition-opacity";

    return (
        <div className={contentClassName} aria-busy={isPending}>
            <BoardPostList
                query={query}
                postList={postList}
                currentUserId={currentUserId}
                deletingPostId={deletingPostId}
                onDeletePost={onDeletePost}
                onTagSearch={onTagSearch}
            />
            <BoardPostListPagination query={query} postList={postList} onPageChange={onPageChange} />
        </div>
    );
}

function BoardPostListResultsLoading() {
    const loadingCards = BOARD_POST_LIST_LOADING_CARD_KEYS.map(renderBoardPostListLoadingCard);

    return (
        <div className="flex flex-col gap-4" aria-label="게시글 목록 불러오는 중">
            <div className="flex flex-col gap-4">{loadingCards}</div>
            <div className="flex justify-center">
                <Skeleton className="h-9 w-56" />
            </div>
        </div>
    );
}

function renderBoardPostListLoadingCard(key: string) {
    return (
        <Card key={key} className="gap-0 rounded-lg border-border bg-card p-5 shadow-none sm:p-6">
            <CardHeader className="gap-3 p-0">
                <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                </div>
            </CardHeader>
            <CardContent className="mt-3 flex flex-col gap-2 p-0">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
            </CardContent>
        </Card>
    );
}

type DongBoardFilterProps = {
    dongCode?: string;
    onDongFilterChange: (value: string) => void;
};

function DongBoardFilter({ dongCode, onDongFilterChange }: DongBoardFilterProps) {
    const selectedValue = dongCode ?? DONG_FILTER_ALL_VALUE;
    const filterItems = DONG_BOARD_FILTER_OPTIONS.map(renderDongBoardFilterOption);

    return (
        <ToggleGroup
            type="single"
            value={selectedValue}
            onValueChange={onDongFilterChange}
            variant="default"
            size="sm"
            spacing={2}
            className="flex w-full max-w-full flex-wrap justify-center gap-2"
            aria-label="동네 필터"
        >
            {filterItems}
        </ToggleGroup>
    );
}

type DongBoardFilterOption = {
    value: string;
    label: string;
};

function renderDongBoardFilterOption(option: DongBoardFilterOption) {
    return (
        <ToggleGroupItem
            key={option.value}
            value={option.value}
            aria-label={option.label}
            className="text-muted-foreground hover:bg-muted hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground"
        >
            {option.label}
        </ToggleGroupItem>
    );
}

function getBoardTitle(dongName?: string | null) {
    if (dongName) {
        return `${dongName} 이웃 글`;
    }

    return "동네 이웃 글";
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
