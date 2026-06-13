import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Alert, AlertDescription } from "@nmm/ui/components/alert";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@nmm/ui/components/field";
import { Input } from "@nmm/ui/components/input";
import { DEFAULT_BOARD_POST_LIST_QUERY } from "@nmm/shared";
import { useState, type FormEvent } from "react";
import { SignUpInputSchema, currentUserQueryOptions, signUpWithEmail } from "@/features/auth";

export function SignupPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [formError, setFormError] = useState<string | null>(null);
    const signUpMutation = useMutation({
        mutationFn: signUpWithEmail,
        onSuccess: handleSignUpSuccess,
        onError: handleSignUpError
    });

    async function handleSignUpSuccess() {
        await queryClient.invalidateQueries({
            queryKey: currentUserQueryOptions.queryKey
        });
        await navigate({ to: "/board", search: DEFAULT_BOARD_POST_LIST_QUERY });
    }

    function handleSignUpError(error: Error) {
        setFormError(error.message);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const input = SignUpInputSchema.safeParse({
            name: String(formData.get("name") ?? ""),
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? "")
        });

        if (!input.success) {
            setFormError(input.error.issues[0]?.message ?? "입력값을 확인해주세요.");
            return;
        }

        setFormError(null);
        signUpMutation.mutate(input.data);
    }

    return (
        <section className="mx-auto flex w-full max-w-md px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>회원가입</CardTitle>
                    <CardDescription>이메일과 비밀번호로 계정을 만듭니다.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="name">이름</FieldLabel>
                                <Input id="name" name="name" type="text" autoComplete="name" required />
                            </Field>
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
                                    autoComplete="new-password"
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
                        <Button className="w-full" type="submit" disabled={signUpMutation.isPending}>
                            {signUpMutation.isPending ? "가입 중" : "회원가입"}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            이미 계정이 있나요?{" "}
                            <Link
                                className="font-medium text-foreground underline-offset-4 hover:underline"
                                to="/auth/login"
                            >
                                로그인
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </section>
    );
}
