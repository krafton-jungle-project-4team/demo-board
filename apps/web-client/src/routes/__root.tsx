import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { Suspense } from "react";
import { AppErrorBoundary } from "@/app/providers/app-error-boundary";
import { QueryProvider } from "@/app/providers/query-provider";
import { Header } from "@/app/root/header";
import { RouteErrorFallback } from "@/app/root/route-error-fallback";
import { RoutePending } from "@/app/root/route-pending";

export const Route = createRootRoute({
    component: RootLayout
});

function RootLayout() {
    return (
        <QueryProvider>
            <NuqsAdapter>
                <div className="min-h-svh">
                    <Header />
                    <main>
                        <QueryErrorResetBoundary>{renderQueryErrorResetBoundary}</QueryErrorResetBoundary>
                    </main>
                </div>
                {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
            </NuqsAdapter>
        </QueryProvider>
    );
}

type QueryErrorResetBoundaryRenderProps = {
    reset: () => void;
};

function renderQueryErrorResetBoundary({ reset }: QueryErrorResetBoundaryRenderProps) {
    return (
        <AppErrorBoundary onReset={reset} fallback={renderRouteErrorFallback}>
            <Suspense fallback={<RoutePending />}>
                <Outlet />
            </Suspense>
        </AppErrorBoundary>
    );
}

type RouteErrorFallbackRenderProps = {
    error: Error;
    reset: () => void;
};

function renderRouteErrorFallback({ error, reset }: RouteErrorFallbackRenderProps) {
    return <RouteErrorFallback error={error} onRetry={reset} />;
}
