import { createRouter, parseSearchWith, stringifySearchWith } from "@tanstack/react-router";
import { routeTree } from "../routeTree.gen";

export const router = createRouter({
    routeTree,
    parseSearch: parseSearchWith((value) => value),
    stringifySearch: stringifySearchWith((value) => String(value))
});

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}
