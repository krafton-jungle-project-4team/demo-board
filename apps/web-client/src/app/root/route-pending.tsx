import { Card, CardContent } from "@nmm/ui/components";

export function RoutePending() {
    return (
        <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <Card>
                <CardContent className="text-sm text-muted-foreground">불러오는 중</CardContent>
            </Card>
        </section>
    );
}
