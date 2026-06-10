import { useNavigate } from "@tanstack/react-router";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@nmm/ui/components";
import type { CompleteSignUpRequest } from "@nmm/shared";
import { useCompleteSignUpMutation } from "@/features/auth";

export function CompleteSignUpPage() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const completeSignUpMutation = useCompleteSignUpMutation({
        onSuccess: handleCompleteSignUpSuccess
    });

    function handleCompleteSignUpSuccess() {
        void navigate({ to: "/posts" });
    }

    function handleCompleteSignUpError() {
        setErrorMessage("가입 완료 처리에 실패했습니다.");
    }

    function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
        setName(event.target.value);
    }

    function handleSignUpSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);
        const request: CompleteSignUpRequest = { name };

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
                    <form className="grid gap-4" onSubmit={handleSignUpSubmit}>
                        <div className="grid gap-2">
                            <Label htmlFor="signup-name">이름</Label>
                            <Input id="signup-name" required minLength={1} value={name} onChange={handleNameChange} />
                        </div>
                        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
                        <Button type="submit" disabled={completeSignUpMutation.isPending || name.trim().length === 0}>
                            완료
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </section>
    );
}
