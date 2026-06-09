import { useQueryStates } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { postSearchParsers, toFindPostsParams } from "../model/post-search";

export function usePostSearch() {
    const [search, setSearch] = useQueryStates(postSearchParsers);
    const { page, q, sort, view } = search;
    const [queryDraft, setQueryDraft] = useState(q);

    useEffect(() => {
        setQueryDraft(q);
    }, [q]);

    const submitQueryDraft = useCallback(() => {
        if (queryDraft !== q || page !== 1) {
            void setSearch({
                q: queryDraft,
                page: 1
            });
        }
    }, [page, q, queryDraft, setSearch]);

    const params = useMemo(() => toFindPostsParams({ page, q, sort, view }), [page, q, sort, view]);

    return {
        queryDraft,
        search,
        setQueryDraft,
        setSearch,
        submitQueryDraft,
        params
    };
}
