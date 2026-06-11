import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useController, useForm, type Control } from "react-hook-form";
import { CompleteSignUpRequestSchema, type CompleteSignUpRequest } from "@nmm/shared";
import { Badge } from "@nmm/ui/components/badge";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@nmm/ui/components/field";
import { Input } from "@nmm/ui/components/input";
import { useCompleteSignUpMutation } from "@/features/auth/api/auth-queries";

export function CompleteSignUpPage() {
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const form = useForm<CompleteSignUpRequest>({
        resolver: zodResolver(CompleteSignUpRequestSchema),
        defaultValues: {
            name: ""
        },
        mode: "onChange"
    });
    const nameValue = form.watch("name");
    const completeSignUpMutation = useCompleteSignUpMutation({
        onSuccess: handleCompleteSignUpSuccess
    });

    function handleCompleteSignUpSuccess() {
        void navigate({ to: "/posts" });
    }

    function handleCompleteSignUpError() {
        setErrorMessage("가입 완료 처리에 실패했습니다.");
    }

    function handleSignUpSubmit(request: CompleteSignUpRequest) {
        setErrorMessage(null);

        completeSignUpMutation.mutate(request, { onError: handleCompleteSignUpError });
    }

    return (
        <section className="mx-auto grid min-h-[calc(100svh-3.5rem)] w-full max-w-md content-center px-4 py-10 sm:px-6">
            <Card>
                <CardHeader>
                    <CardTitle>가입 완료</CardTitle>
                    <CardDescription>게시판에서 사용할 이름을 입력합니다.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-4" onSubmit={form.handleSubmit(handleSignUpSubmit)}>
                        <FieldGroup>
                            <SignUpNameField control={form.control} disabled={completeSignUpMutation.isPending} />
                        </FieldGroup>
                        {errorMessage ? <Badge variant="destructive">{errorMessage}</Badge> : null}
                        <Button
                            type="submit"
                            disabled={completeSignUpMutation.isPending || nameValue.trim().length === 0}
                        >
                            완료
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </section>
    );
}

type SignUpNameFieldProps = {
    control: Control<CompleteSignUpRequest>;
    disabled: boolean;
};

function SignUpNameField({ control, disabled }: SignUpNameFieldProps) {
    const { field, fieldState } = useController({
        control,
        name: "name"
    });

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="signup-name">이름</FieldLabel>
            <Input
                {...field}
                id="signup-name"
                required
                minLength={1}
                aria-invalid={fieldState.invalid}
                disabled={disabled}
            />
            <FieldError>{fieldState.error?.message}</FieldError>
        </Field>
    );
}
