import { queryOptions } from "@tanstack/react-query";
import { getExample } from "./example-api";

export const exampleQueryOptions = queryOptions({
    queryKey: ["example"],
    queryFn: getExample
});
