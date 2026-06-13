import { Outlet, createRootRoute } from "@tanstack/react-router";
import { QueryErrorResetBoundary, useQueryErrorResetBoundary } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { Suspense } from "react";
import { Toaster } from "@nmm/ui/components/sonner";
import { AppErrorBoundary } from "@/app/providers/app-error-boundary";
import { QueryProvider } from "@/app/providers/query-provider";
import { Header } from "@/app/root/header";
import { RouteErrorFallback } from "@/app/root/route-error-fallback";
import { RoutePending } from "@/app/root/route-pending";

// 앱 전역 레이아웃과 공통 provider를 감싸는 루트 라우트다.
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
                        {/* QueryErrorResetBoundary 컴포넌트를 사용하면 해당 컴포넌트의 경계 안에서 발생한 모든 쿼리 오류를 초기화 한다.
                            suspense 또는 throwOnError를 사용할 때 필요하다. */}
                        <QueryErrorResetBoundary>
                            <RootRouteBoundary />
                        </QueryErrorResetBoundary>
                    </main>
                </div>
                <Toaster />
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
