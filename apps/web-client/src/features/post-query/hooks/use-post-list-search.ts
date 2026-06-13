import { useNavigate } from "@tanstack/react-router";
import type { PostListQuery } from "@nmm/shared";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";

export function usePostListSearch(query: PostListQuery) {
    const navigate = useNavigate({ from: "/" });
    const [keyword, setKeyword] = useState(query.q ?? "");

    // URL 검색어가 바뀌면 입력창 상태도 같은 값으로 맞춘다.
    useEffect(() => {
        setKeyword(query.q ?? "");
    }, [query.q]);

    // 입력 중인 검색어를 로컬 상태에만 반영한다.
    function handleKeywordChange(event: ChangeEvent<HTMLInputElement>) {
        setKeyword(event.target.value);
    }

    // 검색 제출 시 검색어를 정리하고 첫 페이지 URL로 이동한다.
    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const nextKeyword = keyword.trim();

        void navigate({
            to: "/",
            search: {
                page: 1,
                pageSize: query.pageSize,
                q: nextKeyword.length > 0 ? nextKeyword : undefined
            }
        });
    }

    // 검색어 입력값과 URL 검색 조건을 모두 비운다.
    function handleClearSearch() {
        setKeyword("");

        void navigate({
            to: "/",
            search: {
                page: 1,
                pageSize: query.pageSize,
                q: undefined
            }
        });
    }

    // 검색 조건은 유지한 채 선택한 페이지만 URL에 반영한다.
    function handlePageChange(page: number) {
        if (page === query.page) {
            return;
        }

        void navigate({
            to: "/",
            search: {
                page,
                pageSize: query.pageSize,
                q: query.q
            }
        });
    }

    return {
        keyword,
        handleKeywordChange,
        handleSearchSubmit,
        handleClearSearch,
        handlePageChange
    };
}
