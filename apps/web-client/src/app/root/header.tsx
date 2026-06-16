import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BoardPostListQuerySchema } from "@nmm/shared";
import { Badge } from "@nmm/ui/components/badge";
import { Button } from "@nmm/ui/components/button";
import { currentUserQueryOptions, signOut } from "@/features/auth";

const defaultBoardPostListSearch = BoardPostListQuerySchema.parse({});

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
                    <Link to="/board" search={defaultBoardPostListSearch}>
                        송파 생활 게시판
                    </Link>
                </Button>
                <nav className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm">
                        <Link
                            to="/board"
                            search={defaultBoardPostListSearch}
                            activeProps={{
                                className: "bg-accent text-accent-foreground"
                            }}
                        >
                            게시글
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                        <Link
                            to="/estate"
                            activeProps={{
                                className: "bg-accent text-accent-foreground"
                            }}
                        >
                            매물검색
                        </Link>
                    </Button>
                    {currentUser ? (
                        <>
                            <Button asChild variant="ghost" size="sm">
                                <Link
                                    to="/profile"
                                    activeProps={{
                                        className: "bg-accent text-accent-foreground"
                                    }}
                                >
                                    {currentUser.name || currentUser.email}
                                    {currentUser.residenceDongName ? (
                                        <Badge variant="outline">{currentUser.residenceDongName}</Badge>
                                    ) : null}
                                </Link>
                            </Button>
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
                                    to="/auth/login"
                                    activeProps={{
                                        className: "bg-accent text-accent-foreground"
                                    }}
                                >
                                    로그인
                                </Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link to="/auth/signup">회원가입</Link>
                            </Button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
