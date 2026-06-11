import { Outlet, createRootRoute } from "@tanstack/react-router";
import { QueryErrorResetBoundary, useQueryErrorResetBoundary } from "@tanstack/react-query";
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
                        <QueryErrorResetBoundary>
                            <RootRouteBoundary />
                        </QueryErrorResetBoundary>
                    </main>
                </div>
                {/* 필요해지면 TanStack Router Devtools를 도입할 수 있지만, 현재는 필요성이 없다. */}
            </NuqsAdapter>
        </QueryProvider>
    );
}

function RootRouteBoundary() {
    const { reset } = useQueryErrorResetBoundary();

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
