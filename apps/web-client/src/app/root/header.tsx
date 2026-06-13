import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PostListQuerySchema } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import { currentUserQueryOptions, signOut } from "@/features/auth";

const defaultPostListSearch = PostListQuerySchema.parse({});

export function Header() {
    const queryClient = useQueryClient();
    const currentUserQuery = useQuery(currentUserQueryOptions);
    const currentUser = currentUserQuery.data;
    const signOutMutation = useMutation({
        mutationFn: signOut,
        onSuccess: handleSignOutSuccess
    });

    async function handleSignOutSuccess() {
        await queryClient.invalidateQueries({
            queryKey: currentUserQueryOptions.queryKey
        });
    }

    function handleSignOut() {
        signOutMutation.mutate();
    }

    return (
        <header className="border-b">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Button asChild variant="ghost" size="sm" className="font-semibold">
                    <Link to="/" search={defaultPostListSearch}>
                        NMM Board
                    </Link>
                </Button>
                <nav className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm">
                        <Link
                            to="/"
                            search={defaultPostListSearch}
                            activeProps={{
                                className: "bg-accent text-accent-foreground"
                            }}
                        >
                            게시글
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                        <Link
                            to="/comments"
                            search={{
                                postId: 1,
                                page: 1
                            }}
                            activeProps={{
                                className: "bg-accent text-accent-foreground"
                            }}
                        >
                            댓글
                        </Link>
                    </Button>
                    {currentUser ? (
                        <>
                            <span className="px-2 text-sm text-muted-foreground">
                                {currentUser.name || currentUser.email}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSignOut}
                                disabled={signOutMutation.isPending}
                            >
                                로그아웃
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button asChild variant="ghost" size="sm">
                                <Link
                                    to="/login"
                                    activeProps={{
                                        className: "bg-accent text-accent-foreground"
                                    }}
                                >
                                    로그인
                                </Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link to="/signup">회원가입</Link>
                            </Button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
