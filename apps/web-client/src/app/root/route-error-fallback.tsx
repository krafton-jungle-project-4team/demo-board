import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components";

type RouteErrorFallbackProps = {
    error: Error;
    onRetry: () => void;
};

export function RouteErrorFallback({ error, onRetry }: RouteErrorFallbackProps) {
    return (
        <section className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
            <Card>
                <CardHeader>
                    <CardTitle>화면을 불러오지 못했습니다.</CardTitle>
                    <CardDescription>{error.message || "알 수 없는 오류가 발생했습니다."}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button type="button" variant="outline" onClick={onRetry}>
                        다시 시도
                    </Button>
                </CardContent>
            </Card>
        </section>
    );
}
