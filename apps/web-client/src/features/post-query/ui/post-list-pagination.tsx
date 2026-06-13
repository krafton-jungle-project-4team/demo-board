import type { MouseEvent, ReactNode } from "react";
import type { PostListQuery, PostListResponse } from "@nmm/shared";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@nmm/ui/components/pagination";

const DISABLED_PAGINATION_LINK_CLASS_NAME = "pointer-events-none opacity-50";
const MAX_VISIBLE_PAGE_COUNT = 5;

type PostListPaginationProps = {
    query: PostListQuery;
    postList: PostListResponse;
    onPageChange: (page: number) => void;
};

export function PostListPagination({ query, postList, onPageChange }: PostListPaginationProps) {
    if (postList.totalPages <= 1) {
        return null;
    }

    const previousPage = Math.max(1, postList.page - 1);
    const nextPage = Math.min(postList.totalPages, postList.page + 1);
    const visiblePages = getVisiblePages(postList.page, postList.totalPages);

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PostListPreviousPageLink
                        query={query}
                        page={previousPage}
                        disabled={!postList.hasPreviousPage}
                        onPageChange={onPageChange}
                    />
                </PaginationItem>
                {visiblePages.map((pageItem) =>
                    pageItem === "ellipsis" ? (
                        <PaginationItem key={pageItem}>
                            <PaginationEllipsis />
                        </PaginationItem>
                    ) : (
                        <PaginationItem key={pageItem}>
                            <PostListPageLink
                                query={query}
                                page={pageItem}
                                isActive={pageItem === postList.page}
                                onPageChange={onPageChange}
                            >
                                {pageItem}
                            </PostListPageLink>
                        </PaginationItem>
                    )
                )}
                <PaginationItem>
                    <PostListNextPageLink
                        query={query}
                        page={nextPage}
                        disabled={!postList.hasNextPage}
                        onPageChange={onPageChange}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}

type PostListPageLinkProps = {
    query: PostListQuery;
    page: number;
    isActive?: boolean;
    disabled?: boolean;
    onPageChange: (page: number) => void;
    children?: ReactNode;
};

function PostListPageLink({ query, page, isActive, disabled, onPageChange, children }: PostListPageLinkProps) {
    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();

        if (disabled || isActive) {
            return;
        }

        onPageChange(page);
    }

    return (
        <PaginationLink
            href={createPostListPageHref(query, page)}
            isActive={isActive}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            className={disabled ? DISABLED_PAGINATION_LINK_CLASS_NAME : undefined}
            onClick={handleClick}
        >
            {children ?? page}
        </PaginationLink>
    );
}

function PostListPreviousPageLink({ query, page, disabled, onPageChange }: PostListPageLinkProps) {
    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();

        if (disabled) {
            return;
        }

        onPageChange(page);
    }

    return (
        <PaginationPrevious
            href={createPostListPageHref(query, page)}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            className={disabled ? DISABLED_PAGINATION_LINK_CLASS_NAME : undefined}
            onClick={handleClick}
        />
    );
}

function PostListNextPageLink({ query, page, disabled, onPageChange }: PostListPageLinkProps) {
    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();

        if (disabled) {
            return;
        }

        onPageChange(page);
    }

    return (
        <PaginationNext
            href={createPostListPageHref(query, page)}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            className={disabled ? DISABLED_PAGINATION_LINK_CLASS_NAME : undefined}
            onClick={handleClick}
        />
    );
}

type VisiblePageItem = number | "ellipsis";

function getVisiblePages(page: number, totalPages: number): VisiblePageItem[] {
    if (totalPages <= MAX_VISIBLE_PAGE_COUNT) {
        return Array.from({ length: totalPages }, createPageNumber);
    }

    if (page <= 3) {
        return [1, 2, 3, 4, "ellipsis", totalPages];
    }

    if (page >= totalPages - 2) {
        return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
}

function createPageNumber(_: unknown, index: number) {
    return index + 1;
}

function createPostListPageHref(query: PostListQuery, page: number) {
    const searchParams = new URLSearchParams({
        page: String(page),
        pageSize: String(query.pageSize),
        searchScope: query.searchScope
    });

    if (query.q) {
        searchParams.set("q", query.q);
    }

    return `/?${searchParams.toString()}`;
}
