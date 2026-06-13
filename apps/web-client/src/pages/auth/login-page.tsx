import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Alert, AlertDescription } from "@nmm/ui/components/alert";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@nmm/ui/components/field";
import { Input } from "@nmm/ui/components/input";
import { DEFAULT_BOARD_POST_LIST_QUERY } from "@nmm/shared";
import { useState, type FormEvent } from "react";
import { SignInInputSchema, currentUserQueryOptions, signInWithEmail } from "@/features/auth";

export function LoginPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [formError, setFormError] = useState<string | null>(null);
    const signInMutation = useMutation({
        mutationFn: signInWithEmail,
        onSuccess: handleSignInSuccess,
        onError: handleSignInError
    });

    async function handleSignInSuccess() {
        await queryClient.invalidateQueries({
            queryKey: currentUserQueryOptions.queryKey
        });
        await navigate({ to: "/board", search: DEFAULT_BOARD_POST_LIST_QUERY });
    }

    function handleSignInError(error: Error) {
        setFormError(error.message);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const input = SignInInputSchema.safeParse({
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? "")
        });

        if (!input.success) {
            setFormError(input.error.issues[0]?.message ?? "입력값을 확인해주세요.");
            return;
        }

        setFormError(null);
        signInMutation.mutate(input.data);
    }

    return (
        <section className="mx-auto flex w-full max-w-md px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>로그인</CardTitle>
                    <CardDescription>게시판 계정으로 계속합니다.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="email">이메일</FieldLabel>
                                <Input id="email" name="email" type="email" autoComplete="email" required />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    minLength={8}
                                    required
                                />
                            </Field>
                        </FieldGroup>
                        {formError ? (
                            <Alert variant="destructive">
                                <AlertDescription>{formError}</AlertDescription>
                            </Alert>
                        ) : null}
                        <Button className="w-full" type="submit" disabled={signInMutation.isPending}>
                            {signInMutation.isPending ? "로그인 중" : "로그인"}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            계정이 없나요?{" "}
                            <Link
                                className="font-medium text-foreground underline-offset-4 hover:underline"
                                to="/auth/signup"
                            >
                                회원가입
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </section>
    );
}
