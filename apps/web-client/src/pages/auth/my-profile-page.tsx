import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@nmm/ui/components";
import {
    signInWithGitHub,
    useCurrentUserQuery,
    useLogoutMutation,
    useUpdateCurrentUserMutation
} from "@/features/auth";

export function MyProfilePage() {
    const navigate = useNavigate();
    const currentUserQuery = useCurrentUserQuery();
    const currentUser = currentUserQuery.data;
    const [name, setName] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const updateCurrentUserMutation = useUpdateCurrentUserMutation({
        onSuccess: () => {
            setMessage("저장되었습니다.");
        }
    });
    const logoutMutation = useLogoutMutation({
        onSuccess: () => {
            void navigate({ to: "/posts" });
        }
    });

    useEffect(() => {
        setName(currentUser?.name ?? "");
    }, [currentUser?.name]);

    function submitProfile(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage(null);
        updateCurrentUserMutation.mutate(
            { name },
            {
                onError: () => {
                    setMessage("저장에 실패했습니다.");
                }
            }
        );
    }

    if (currentUserQuery.isPending) {
        return (
            <section className="mx-auto w-full max-w-3xl px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
                불러오는 중
            </section>
        );
    }

    if (!currentUser) {
        return (
            <section className="mx-auto grid min-h-[calc(100svh-3.5rem)] w-full max-w-md content-center px-4 py-10 sm:px-6">
                <Card>
                    <CardHeader>
                        <CardTitle>내 정보</CardTitle>
                        <CardDescription>로그인이 필요합니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            type="button"
                            onClick={() => {
                                void signInWithGitHub("/me");
                            }}
                        >
                            GitHub 로그인
                        </Button>
                    </CardContent>
                </Card>
            </section>
        );
    }

    if (currentUser.status !== "ACTIVE" || !currentUser.name) {
        return (
            <section className="mx-auto grid min-h-[calc(100svh-3.5rem)] w-full max-w-md content-center px-4 py-10 sm:px-6">
                <Card>
                    <CardHeader>
                        <CardTitle>가입 완료 필요</CardTitle>
                        <CardDescription>게시판에서 사용할 이름을 먼저 입력합니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link to="/auth/complete-signup">가입 완료</Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>
        );
    }

    return (
        <section className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid gap-1">
                <h1 className="text-2xl font-semibold tracking-normal">내 정보</h1>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>프로필</CardTitle>
                    <CardDescription>{currentUser.role}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-4" onSubmit={submitProfile}>
                        <div className="grid gap-2">
                            <Label htmlFor="profile-name">이름</Label>
                            <Input
                                id="profile-name"
                                required
                                value={name}
                                onChange={(event) => {
                                    setName(event.target.value);
                                }}
                            />
                        </div>
                        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={
                                    updateCurrentUserMutation.isPending ||
                                    name.trim().length === 0 ||
                                    name === currentUser.name
                                }
                            >
                                저장
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
            <div className="flex justify-end">
                <Button
                    type="button"
                    variant="outline"
                    disabled={logoutMutation.isPending}
                    onClick={() => {
                        logoutMutation.mutate();
                    }}
                >
                    로그아웃
                </Button>
            </div>
        </section>
    );
}
