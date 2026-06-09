import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { Suspense } from "react";
import { AppErrorBoundary } from "@/app/providers/app-error-boundary";
import { QueryProvider } from "@/app/providers/query-provider";
import { RouteErrorFallback } from "@/app/ui/route-error-fallback";

export const Route = createRootRoute({
  component: RootLayout
});

function RootLayout() {
  return (
    <QueryProvider>
      <NuqsAdapter>
        <div className="min-h-svh">
          <header className="border-b">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link to="/posts" className="text-sm font-semibold">
                NMM
              </Link>
              <nav className="flex items-center gap-1">
                <Link
                  to="/posts"
                  className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                  activeProps={{
                    className: "text-foreground bg-secondary"
                  }}
                >
                  게시글
                </Link>
                <a
                  href="/api/auth/github/start?redirectTo=/posts"
                  className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  GitHub 로그인
                </a>
              </nav>
            </div>
          </header>
          <main>
            <QueryErrorResetBoundary>
              {({ reset }) => (
                <AppErrorBoundary
                  onReset={reset}
                  fallback={({ error, reset: resetBoundary }) => (
                    <RouteErrorFallback error={error} onRetry={resetBoundary} />
                  )}
                >
                  <Suspense fallback={<RoutePending />}>
                    <Outlet />
                  </Suspense>
                </AppErrorBoundary>
              )}
            </QueryErrorResetBoundary>
          </main>
        </div>
        {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
      </NuqsAdapter>
    </QueryProvider>
  );
}

function RoutePending() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
      불러오는 중
    </section>
  );
}
