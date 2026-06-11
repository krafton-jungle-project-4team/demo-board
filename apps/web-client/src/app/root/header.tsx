import { Link } from "@tanstack/react-router";
import { Badge, Button } from "@nmm/ui/components";
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
                <Button asChild variant="ghost" size="sm" className="font-semibold">
                    <Link to="/posts">NMM</Link>
                </Button>
                <nav className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm">
                        <Link
                            to="/posts"
                            activeProps={{
                                className: "bg-accent text-accent-foreground"
                            }}
                        >
                            게시글
                        </Link>
                    </Button>
                    {currentUserQuery.isPending ? (
                        <Badge variant="secondary">확인 중</Badge>
                    ) : hasCompleteActiveProfile(currentUser) ? (
                        <Button asChild variant="ghost" size="sm">
                            <Link to="/me">{currentUser.name}</Link>
                        </Button>
                    ) : currentUser ? (
                        <Button asChild variant="ghost" size="sm">
                            <Link to="/auth/complete-signup">가입 완료 필요</Link>
                        </Button>
                    ) : (
                        <Button type="button" variant="ghost" size="sm" onClick={handleSignInClick}>
                            GitHub 로그인
                        </Button>
                    )}
                </nav>
            </div>
        </header>
    );
}
