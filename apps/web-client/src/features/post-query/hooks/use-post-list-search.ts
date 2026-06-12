import { useNavigate } from "@tanstack/react-router";
import type { PostListQuery } from "@nmm/shared";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";

export function usePostListSearch(query: PostListQuery) {
    const navigate = useNavigate({ from: "/" });
    const [keyword, setKeyword] = useState(query.q ?? "");

    useEffect(() => {
        setKeyword(query.q ?? "");
    }, [query.q]);

    function handleKeywordChange(event: ChangeEvent<HTMLInputElement>) {
        setKeyword(event.target.value);
    }

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
