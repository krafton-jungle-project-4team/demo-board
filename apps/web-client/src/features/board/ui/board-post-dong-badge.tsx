import { Badge } from "@nmm/ui/components/badge";

type BoardPostDongBadgeProps = {
    dongName: string | null;
};

export function BoardPostDongBadge({ dongName }: BoardPostDongBadgeProps) {
    return <Badge variant="secondary">{dongName ?? "전체"}</Badge>;
}
