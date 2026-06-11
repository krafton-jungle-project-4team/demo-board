import { Link } from "@tanstack/react-router";
import type { FormEvent } from "react";
import LayoutGrid from "lucide-react/dist/esm/icons/layout-grid.mjs";
import List from "lucide-react/dist/esm/icons/list.mjs";
import Plus from "lucide-react/dist/esm/icons/plus.mjs";
import Search from "lucide-react/dist/esm/icons/search.mjs";
import type { PostTag } from "@nmm/shared";
import { Badge } from "@nmm/ui/components/badge";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent } from "@nmm/ui/components/card";
import { Input } from "@nmm/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nmm/ui/components/select";
import { useCurrentUserQuery } from "@/features/auth/api/auth-queries";
import { usePostListQuery, usePostTagsQuery } from "@/features/posts/api/post-queries";
import { usePostSearch } from "@/features/posts/hooks/use-post-search";
import {
    parsePostSortSelectValue,
    parsePostTagSelectValue,
    postSortValues,
    toPostTagSelectValue
} from "@/features/posts/model/post-search";
import { PostCards } from "@/features/posts/ui/post-cards";
import { PostTable } from "@/features/posts/ui/post-table";

const EMPTY_POST_TAGS: PostTag[] = [];

const sortLabels = {
    "created-desc": "최신순",
    "created-asc": "오래된순",
    "title-asc": "제목순"
} as const;

export function PostsPage() {
    const { search, setSearch, submitQuery, params } = usePostSearch();
    const currentUser = useCurrentUserQuery().data;
    const tagsQuery = usePostTagsQuery();
    const postsQuery = usePostListQuery(params);
    const tags = tagsQuery.data ?? EMPTY_POST_TAGS;
    const postsData = postsQuery.data;
    const currentPage = postsData?.page ?? search.page;
    const selectedTagValue = toPostTagSelectValue(search.tagId);

    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const query = String(formData.get("q") ?? "");

        submitQuery(query);
    }

    function handleSortChange(sort: string) {
        const nextSort = parsePostSortSelectValue(sort);

        if (nextSort === null) {
            return;
        }

        void setSearch({
            sort: nextSort,
            page: 1
        });
    }

    function handleTagChange(value: string) {
        const tagId = parsePostTagSelectValue(value);

        if (tagId === undefined) {
            return;
        }

        void setSearch({
            tagId,
            page: 1
        });
    }

    function handleTableViewClick() {
        void setSearch({
            view: "table",
            page: 1
        });
    }

    function handleCardViewClick() {
        void setSearch({
            view: "card",
            page: 1
        });
    }

    function handlePreviousPageClick() {
        void setSearch({ page: Math.max(1, currentPage - 1) });
    }

    function handleNextPageClick() {
        if (!postsData) {
            return;
        }

        void setSearch({ page: Math.min(postsData.totalPages, postsData.page + 1) });
    }

    return (
        <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="grid gap-1">
                    <h1 className="text-2xl font-semibold tracking-normal">게시판 보일러플레이트</h1>
                    <p className="text-muted-foreground text-sm">
                        라우터, 서버 상태, URL 상태, shared contract 흐름을 검증하는 CRUD 화면입니다.
                    </p>
                </div>
                <Button asChild>
                    <Link to="/posts/new">
                        <Plus />
                        작성
                    </Link>
                </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_160px_auto]">
                <form className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleSearchSubmit}>
                    <div className="relative">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input key={search.q} name="q" className="pl-9" placeholder="검색어" defaultValue={search.q} />
                    </div>
                    <Button type="submit" variant="outline">
                        <Search />
                        검색
                    </Button>
                </form>
                <Select value={search.sort} onValueChange={handleSortChange}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {postSortValues.map((sort) => (
                            <SelectItem key={sort} value={sort}>
                                {sortLabels[sort]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={selectedTagValue} onValueChange={handleTagChange}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체 태그</SelectItem>
                        {tags.map((tag) => (
                            <SelectItem key={tag.id} value={String(tag.id)}>
                                {tag.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        size="icon"
                        variant={search.view === "table" ? "secondary" : "ghost"}
                        aria-label="표 보기"
                        onClick={handleTableViewClick}
                    >
                        <List />
                    </Button>
                    <Button
                        type="button"
                        size="icon"
                        variant={search.view === "card" ? "secondary" : "ghost"}
                        aria-label="카드 보기"
                        onClick={handleCardViewClick}
                    >
                        <LayoutGrid />
                    </Button>
                </div>
            </div>

            {postsData ? (
                <>
                    {search.view === "table" ? (
                        <PostTable currentUser={currentUser} posts={postsData.items} />
                    ) : (
                        <PostCards currentUser={currentUser} posts={postsData.items} />
                    )}

                    <div className="flex items-center justify-between gap-3">
                        <Badge variant="secondary">
                            {currentPage} / {postsData.totalPages}
                        </Badge>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={currentPage <= 1}
                                onClick={handlePreviousPageClick}
                            >
                                이전
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={currentPage >= postsData.totalPages}
                                onClick={handleNextPageClick}
                            >
                                다음
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <Card>
                    <CardContent className="text-sm text-muted-foreground">불러오는 중</CardContent>
                </Card>
            )}
        </section>
    );
}
