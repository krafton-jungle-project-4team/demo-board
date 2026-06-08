import { Button } from "@nmm/ui/components";

type RouteErrorFallbackProps = {
  error: Error;
  onRetry: () => void;
};

export function RouteErrorFallback({ error, onRetry }: RouteErrorFallbackProps) {
  return (
    <section className="mx-auto grid w-full max-w-3xl gap-3 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-xl font-semibold tracking-normal">화면을 불러오지 못했습니다.</h1>
      <p className="text-muted-foreground text-sm">{error.message || "알 수 없는 오류가 발생했습니다."}</p>
      <div>
        <Button type="button" variant="outline" onClick={onRetry}>
          다시 시도
        </Button>
      </div>
    </section>
  );
}
