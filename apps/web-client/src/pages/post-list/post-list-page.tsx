import { useSuspenseQuery } from "@tanstack/react-query";
import type { PostListQuery } from "@nmm/shared";
import {
    PostListPagination,
    PostListSearchForm,
    PostListTable,
    postListQueryOptions,
    usePostListSearch
} from "@/features/post-query";

type PostListPageProps = {
    query: PostListQuery;
};

export function PostListPage({ query }: PostListPageProps) {
    const postListQuery = useSuspenseQuery(postListQueryOptions(query));
    const postList = postListQuery.data;
    const {
        keyword,
        searchScope,
        handleKeywordChange,
        handleSearchScopeChange,
        handleSearchSubmit,
        handleClearSearch,
        handlePageChange
    } = usePostListSearch(query);

    return (
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">게시글</h1>
                <p className="text-sm text-muted-foreground">부동산 매물과 생활 정보를 모아 보는 공간입니다.</p>
            </div>
            <PostListSearchForm
                keyword={keyword}
                searchScope={searchScope}
                onKeywordChange={handleKeywordChange}
                onSearchScopeChange={handleSearchScopeChange}
                onSubmit={handleSearchSubmit}
                onClear={handleClearSearch}
            />
            <PostListTable postList={postList} />
            <PostListPagination query={query} postList={postList} onPageChange={handlePageChange} />
        </section>
    );
}
