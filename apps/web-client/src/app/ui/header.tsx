import { Link } from "@tanstack/react-router";
import { hasCompleteActiveProfile, signInWithGitHub, useCurrentUserQuery } from "@/features/auth";

function handleSignInClick() {
    void signInWithGitHub("/posts");
}

export function Header() {
    const currentUserQuery = useCurrentUserQuery();
    const currentUser = currentUserQuery.data;

    return (
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
                            className: "bg-secondary text-foreground"
                        }}
                    >
                        게시글
                    </Link>
                    {currentUserQuery.isPending ? (
                        <span className="rounded-lg px-3 py-2 text-sm text-muted-foreground">확인 중</span>
                    ) : hasCompleteActiveProfile(currentUser) ? (
                        <Link
                            to="/me"
                            className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            {currentUser.name}
                        </Link>
                    ) : currentUser ? (
                        <Link
                            to="/auth/complete-signup"
                            className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            가입 완료 필요
                        </Link>
                    ) : (
                        <button
                            type="button"
                            className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                            onClick={handleSignInClick}
                        >
                            GitHub 로그인
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
}
