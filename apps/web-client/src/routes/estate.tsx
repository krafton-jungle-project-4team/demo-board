import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { EstateSearchPage } from "@/pages/estate/estate-search-page";

export const Route = createFileRoute("/estate")({
    component: EstateRoute
});

function EstateRoute() {
    const isEstateRouteLeaf = useRouterState({
        select: (state) => state.matches[state.matches.length - 1]?.routeId === "/estate"
    });

    return isEstateRouteLeaf ? <EstateSearchPage /> : <Outlet />;
}
