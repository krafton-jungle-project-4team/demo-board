import { createRouter } from "@tanstack/react-router";
import { routeTree } from "../routeTree.gen";

export const router = createRouter({
    routeTree,
    parseSearch,
    stringifySearch
});

function parseSearch(searchString: string): Record<string, unknown> {
    const search = searchString.startsWith("?") ? searchString.slice(1) : searchString;
    const searchParams = new URLSearchParams(search);
    const query: Record<string, string | string[]> = {};

    for (const [key, value] of searchParams) {
        const previousValue = query[key];

        if (previousValue === undefined) {
            query[key] = value;
            continue;
        }

        if (Array.isArray(previousValue)) {
            previousValue.push(value);
            continue;
        }

        query[key] = [previousValue, value];
    }

    return query;
}

function stringifySearch(search: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(search)) {
        if (value === undefined) {
            continue;
        }

        if (Array.isArray(value)) {
            for (const item of value) {
                if (item !== undefined) {
                    searchParams.append(key, String(item));
                }
            }
            continue;
        }

        searchParams.set(key, String(value));
    }

    const searchString = searchParams.toString();

    return searchString ? `?${searchString}` : "";
}

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}
