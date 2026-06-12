import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { exampleQueryOptions } from "@/features/example";

export function ExamplePage() {
    const exampleQuery = useSuspenseQuery(exampleQueryOptions);
    const example = exampleQuery.data;

    return (
        <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle>템플릿 예시</CardTitle>
                    <CardDescription>TypeORM에서 읽은 더미 데이터입니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>{example.message}</p>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                        <dt className="font-medium text-foreground">ID</dt>
                        <dd>{example.id}</dd>
                        <dt className="font-medium text-foreground">Created</dt>
                        <dd>{example.createdAt}</dd>
                    </dl>
                </CardContent>
            </Card>
        </section>
    );
}
