import { useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, List, Plus, Search } from "lucide-react";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nmm/ui/components";
import {
  CreatePostDialog,
  PostCards,
  PostTable,
  postQueryKeys,
  postSortValues,
  useDeletePostMutation,
  usePostListQuery,
  usePostSearch
} from "@/features/posts";

const sortLabels = {
  "created-desc": "최신순",
  "created-asc": "오래된순",
  "title-asc": "제목순"
} as const;

export function PostsPage() {
  const { search, setSearch, params } = usePostSearch();
  const queryClient = useQueryClient();
  const postsData = usePostListQuery(params).data;
  const deleteMutation = useDeletePostMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: postQueryKeys.listPrefix });
    }
  });

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-normal">게시판 보일러플레이트</h1>
          <p className="text-muted-foreground text-sm">
            라우터, 서버 상태, URL 상태, codegen 흐름을 검증하는 CRUD 화면입니다.
          </p>
        </div>
        <CreatePostDialog
          trigger={
            <Button>
              <Plus />
              작성
            </Button>
          }
        />
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9"
            placeholder="검색어"
            value={search.q}
            onChange={(event) => {
              void setSearch({
                q: event.target.value,
                page: 1
              });
            }}
          />
        </div>
        <Select
          value={search.sort}
          onValueChange={(sort) => {
            void setSearch({
              sort: sort as (typeof postSortValues)[number],
              page: 1
            });
          }}
        >
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
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant={search.view === "table" ? "secondary" : "ghost"}
            aria-label="표 보기"
            onClick={() => {
              void setSearch({
                view: "table",
                page: 1
              });
            }}
          >
            <List />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={search.view === "card" ? "secondary" : "ghost"}
            aria-label="카드 보기"
            onClick={() => {
              void setSearch({
                view: "card",
                page: 1
              });
            }}
          >
            <LayoutGrid />
          </Button>
        </div>
      </div>

      {search.view === "table" ? (
        <PostTable posts={postsData.items} onDelete={(id) => deleteMutation.mutate(id)} />
      ) : (
        <PostCards posts={postsData.items} onDelete={(id) => deleteMutation.mutate(id)} />
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {search.page} / {postsData.totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={search.page <= 1}
            onClick={() => {
              void setSearch({ page: Math.max(1, search.page - 1) });
            }}
          >
            이전
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={search.page >= postsData.totalPages}
            onClick={() => {
              void setSearch({ page: Math.min(postsData.totalPages, search.page + 1) });
            }}
          >
            다음
          </Button>
        </div>
      </div>
    </section>
  );
}
