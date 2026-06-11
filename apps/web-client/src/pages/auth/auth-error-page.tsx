import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { signInWithGitHub } from "@/features/auth/api/auth-client";

function handleRetrySignInClick() {
    void signInWithGitHub("/posts");
}

export function AuthErrorPage() {
    return (
        <section className="mx-auto grid min-h-[calc(100svh-3.5rem)] w-full max-w-md content-center px-4 py-10 sm:px-6">
            <Card>
                <CardHeader>
                    <CardTitle>인증 실패</CardTitle>
                    <CardDescription>GitHub 로그인 처리를 완료하지 못했습니다.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button type="button" onClick={handleRetrySignInClick}>
                        다시 로그인
                    </Button>
                </CardContent>
            </Card>
        </section>
    );
}
