import { Badge } from "@nmm/ui/components/badge";

type BoardPostDongBadgeProps = {
    dongName: string | null;
};

export function BoardPostDongBadge({ dongName }: BoardPostDongBadgeProps) {
    if (!dongName) {
        return null;
    }

    return <Badge variant="secondary">{dongName}</Badge>;
}
