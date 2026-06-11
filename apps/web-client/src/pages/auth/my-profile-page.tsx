import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useController, useForm, type Control } from "react-hook-form";
import { UpdateCurrentUserRequestSchema, type UpdateCurrentUserRequest, type User } from "@nmm/shared";
import { Badge } from "@nmm/ui/components/badge";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@nmm/ui/components/field";
import { Input } from "@nmm/ui/components/input";
import { signInWithGitHub } from "@/features/auth/api/auth-client";
import { useCurrentUserQuery, useLogoutMutation, useUpdateCurrentUserMutation } from "@/features/auth/api/auth-queries";
import { hasCompleteActiveProfile } from "@/features/auth/model/user-status";

type ProfileMessage = {
    text: string;
    variant: "secondary" | "destructive";
};

type CompleteActiveProfileUser = User & { name: string; status: "ACTIVE" };

function handleSignInClick() {
    void signInWithGitHub("/me");
}

export function MyProfilePage() {
    const currentUserQuery = useCurrentUserQuery();
    const currentUser = currentUserQuery.data;

    if (currentUserQuery.isPending) {
        return (
            <section className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
                <Card>
                    <CardContent className="text-sm text-muted-foreground">불러오는 중</CardContent>
                </Card>
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
                        <Button type="button" onClick={handleSignInClick}>
                            GitHub 로그인
                        </Button>
                    </CardContent>
                </Card>
            </section>
        );
    }

    if (!hasCompleteActiveProfile(currentUser)) {
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

    const activeUser: CompleteActiveProfileUser = currentUser;

    return <ActiveProfilePage currentUser={activeUser} />;
}

type ActiveProfilePageProps = {
    currentUser: CompleteActiveProfileUser;
};

function ActiveProfilePage({ currentUser }: ActiveProfilePageProps) {
    const navigate = useNavigate();
    const [message, setMessage] = useState<ProfileMessage | null>(null);
    const form = useForm<UpdateCurrentUserRequest>({
        resolver: zodResolver(UpdateCurrentUserRequestSchema),
        defaultValues: {
            name: currentUser.name
        },
        mode: "onChange"
    });
    const nameValue = form.watch("name");
    const updateCurrentUserMutation = useUpdateCurrentUserMutation({
        onSuccess: handleUpdateCurrentUserSuccess
    });
    const logoutMutation = useLogoutMutation({
        onSuccess: handleLogoutSuccess
    });
    const hasProfileChange = nameValue.trim() !== currentUser.name;

    function handleUpdateCurrentUserSuccess() {
        setMessage({
            text: "저장되었습니다.",
            variant: "secondary"
        });
        form.reset({ name: nameValue.trim() });
    }

    function handleUpdateCurrentUserError() {
        setMessage({
            text: "저장에 실패했습니다.",
            variant: "destructive"
        });
    }

    function handleLogoutSuccess() {
        void navigate({ to: "/posts" });
    }

    function handleLogoutClick() {
        logoutMutation.mutate();
    }

    function handleProfileSubmit(request: UpdateCurrentUserRequest) {
        setMessage(null);

        updateCurrentUserMutation.mutate(request, { onError: handleUpdateCurrentUserError });
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
                    <form className="grid gap-4" onSubmit={form.handleSubmit(handleProfileSubmit)}>
                        <FieldGroup>
                            <ProfileNameField control={form.control} disabled={updateCurrentUserMutation.isPending} />
                        </FieldGroup>
                        {message ? <Badge variant={message.variant}>{message.text}</Badge> : null}
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={
                                    updateCurrentUserMutation.isPending ||
                                    nameValue.trim().length === 0 ||
                                    !hasProfileChange
                                }
                            >
                                저장
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
            <div className="flex justify-end">
                <Button type="button" variant="outline" disabled={logoutMutation.isPending} onClick={handleLogoutClick}>
                    로그아웃
                </Button>
            </div>
        </section>
    );
}

type ProfileNameFieldProps = {
    control: Control<UpdateCurrentUserRequest>;
    disabled: boolean;
};

function ProfileNameField({ control, disabled }: ProfileNameFieldProps) {
    const { field, fieldState } = useController({
        control,
        name: "name"
    });

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="profile-name">이름</FieldLabel>
            <Input {...field} id="profile-name" required aria-invalid={fieldState.invalid} disabled={disabled} />
            <FieldError>{fieldState.error?.message}</FieldError>
        </Field>
    );
}
