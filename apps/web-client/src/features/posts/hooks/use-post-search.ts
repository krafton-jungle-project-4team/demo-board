import { useQueryStates } from "nuqs";
import { useCallback, useMemo } from "react";
import { postSearchParsers, toFindPostsParams } from "../model/post-search";

export function usePostSearch() {
    const [search, setSearch] = useQueryStates(postSearchParsers);
    const { page, q, sort, tagId, view } = search;

    const submitQuery = useCallback(
        (nextQuery: string) => {
            if (nextQuery !== q || page !== 1) {
                void setSearch({
                    q: nextQuery,
                    page: 1
                });
            }
        },
        [page, q, setSearch]
    );

    const params = useMemo(() => toFindPostsParams({ page, q, sort, tagId, view }), [page, q, sort, tagId, view]);

    return {
        search,
        setSearch,
        submitQuery,
        params
    };
}
