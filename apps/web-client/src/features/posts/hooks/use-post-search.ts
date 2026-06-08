import { useQueryStates } from "nuqs";
import { postSearchParsers, toFindPostsParams } from "../model/post-search";

export function usePostSearch() {
  const [search, setSearch] = useQueryStates(postSearchParsers);

  return {
    search,
    setSearch,
    params: toFindPostsParams(search)
  };
}
