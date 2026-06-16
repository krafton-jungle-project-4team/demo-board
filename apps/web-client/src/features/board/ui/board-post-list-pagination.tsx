import type { MouseEvent, ReactNode } from "react";
import type { BoardPostListQuery, BoardPostListResponse } from "@nmm/shared";
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

type BoardPostListPaginationProps = {
    query: BoardPostListQuery;
    postList: BoardPostListResponse;
    onPageChange: (page: number) => void;
};

export function BoardPostListPagination({ query, postList, onPageChange }: BoardPostListPaginationProps) {
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
                    <BoardPostPreviousPageLink
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
                            <BoardPostPageLink
                                query={query}
                                page={pageItem}
                                isActive={pageItem === postList.page}
                                onPageChange={onPageChange}
                            >
                                {pageItem}
                            </BoardPostPageLink>
                        </PaginationItem>
                    )
                )}
                <PaginationItem>
                    <BoardPostNextPageLink
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

type BoardPostPageLinkProps = {
    query: BoardPostListQuery;
    page: number;
    isActive?: boolean;
    disabled?: boolean;
    onPageChange: (page: number) => void;
    children?: ReactNode;
};

function BoardPostPageLink({ query, page, isActive, disabled, onPageChange, children }: BoardPostPageLinkProps) {
    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();

        if (disabled || isActive) {
            return;
        }

        onPageChange(page);
    }

    return (
        <PaginationLink
            href={createBoardPostListPageHref(query, page)}
            isActive={isActive}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            className={disabled ? DISABLED_PAGINATION_LINK_CLASS_NAME : undefined}
            onClick={handleClick}
        >
            {children}
        </PaginationLink>
    );
}

function BoardPostPreviousPageLink({ query, page, disabled, onPageChange }: BoardPostPageLinkProps) {
    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();

        if (disabled) {
            return;
        }

        onPageChange(page);
    }

    return (
        <PaginationPrevious
            href={createBoardPostListPageHref(query, page)}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            className={disabled ? DISABLED_PAGINATION_LINK_CLASS_NAME : undefined}
            onClick={handleClick}
        />
    );
}

function BoardPostNextPageLink({ query, page, disabled, onPageChange }: BoardPostPageLinkProps) {
    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();

        if (disabled) {
            return;
        }

        onPageChange(page);
    }

    return (
        <PaginationNext
            href={createBoardPostListPageHref(query, page)}
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

function createBoardPostListPageHref(query: BoardPostListQuery, page: number) {
    const searchParams = new URLSearchParams({
        page: String(page),
        pageSize: String(query.pageSize),
        searchScope: query.searchScope
    });

    if (query.q) {
        searchParams.set("q", query.q);
    }

    if (query.dongCode) {
        searchParams.set("dongCode", query.dongCode);
    }

    return `/board?${searchParams.toString()}`;
}
